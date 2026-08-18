import { getRunById } from "./runs";
import { activeQaForRun, enqueueQaRevisit, processQaRevisit } from "./qa";
import {
  latestPromptStrengthenForRun,
  processPromptStrengthen,
  queuePromptStrengthenForRun,
} from "./prompt-strengthen";
import type { RunRow } from "./types";

/** Queue a thread revisit (when a source exists) and a prompt-strengthen pass. */
export async function queuePublishedRunFollowup(run: RunRow): Promise<void> {
  if (run.status !== "published" || !run.serial) return;
  try {
    await enqueueQaRevisit({
      run,
      flaggedBy: run.user_id,
      note: "Auto after publish: fill in context from the source thread.",
    });
  } catch (err) {
    console.error(JSON.stringify({ event: "run_followup_qa_queue_failed", run_id: run.id, error: String(err) }));
  }
  try {
    await queuePromptStrengthenForRun(run);
  } catch (err) {
    console.error(JSON.stringify({ event: "run_followup_prompt_queue_failed", run_id: run.id, error: String(err) }));
  }
}

/** Queue, then run the revisit (if any) and the prompt pass so a tagged post is live, then richer. */
export async function polishPublishedRun(run: RunRow): Promise<void> {
  await queuePublishedRunFollowup(run);
  const qa = await activeQaForRun(run.id);
  if (qa) {
    try {
      await processQaRevisit(qa.id);
    } catch (err) {
      console.error(JSON.stringify({ event: "run_followup_qa_failed", run_id: run.id, error: String(err) }));
    }
  }
  const fresh = (await getRunById(run.id)) ?? run;
  const prompt = await latestPromptStrengthenForRun(fresh.id);
  if (prompt && (prompt.status === "queued" || prompt.status === "running")) {
    try {
      await processPromptStrengthen(prompt.id);
    } catch (err) {
      console.error(JSON.stringify({ event: "run_followup_prompt_failed", run_id: run.id, error: String(err) }));
    }
  }
}
