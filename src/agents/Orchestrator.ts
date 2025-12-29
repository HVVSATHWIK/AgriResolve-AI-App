import { ConsolidatedAgent } from './definitions/ConsolidatedAgent';
import { AssessmentData, AssessmentStatus } from '../types';

// Instantiate the Omni-Agent
const consolidatedAgent = new ConsolidatedAgent();

export type StatusCallback = (status: AssessmentStatus) => void;

export async function runAgenticPipeline(
    imageB64: string,
    onStatusUpdate: StatusCallback,
    language: string = 'en'
): Promise<AssessmentData> {

    // Start with perception (UI effect)
    onStatusUpdate(AssessmentStatus.PERCEIVING);

    try {
        // ONE API CALL to rule them all
        // While waiting, we can artificially cycle states if we wanted, 
        // but for now we just wait.
        const result = await consolidatedAgent.run(imageB64, language);

        // Rapidly progress through states for the visual flair on the frontend
        // (The user expects to see these stages)
        onStatusUpdate(AssessmentStatus.EVALUATING);
        await new Promise(r => setTimeout(r, 400)); // Visual pacing

        onStatusUpdate(AssessmentStatus.DEBATING);
        await new Promise(r => setTimeout(r, 400));

        onStatusUpdate(AssessmentStatus.ARBITRATING);
        await new Promise(r => setTimeout(r, 400));

        onStatusUpdate(AssessmentStatus.EXPLAINING);
        await new Promise(r => setTimeout(r, 400));

        onStatusUpdate(AssessmentStatus.COMPLETED);

        return result;

    } catch (error) {
        console.error("Pipeline Error:", error);
        onStatusUpdate(AssessmentStatus.ERROR);
        throw error;
    }
}

