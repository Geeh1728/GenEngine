import { architectFlow } from './agents/architect';
import { physicistFlow } from './agents/physicist';
import { visionFlow } from './agents/vision';
import { saboteurFlow } from './agents/saboteur';
import { orchestratorFlow } from './agents/orchestrator';
import { librarianAgent } from './agents/librarian';
import { researcherAgent } from './agents/researcher';
import { reviewerAgent } from './agents/reviewer';
import { sentinelAgent, sentinelRepairAgent } from './agents/sentinel';
import { translatorAgent } from './agents/translator';
import { masteryChallengeFlow } from './mastery_agent';
import { logicTutorFlow } from './logicFlow';
import { simulationFlow } from './simulation';
import { spatialCommentaryFlow } from './spatial_agent';

// Export all flows for Genkit CLI
export { 
    architectFlow, 
    physicistFlow, 
    visionFlow, 
    saboteurFlow, 
    orchestratorFlow,
    librarianAgent,
    researcherAgent,
    reviewerAgent,
    sentinelAgent,
    sentinelRepairAgent,
    translatorAgent,
    masteryChallengeFlow,
    logicTutorFlow,
    simulationFlow,
    spatialCommentaryFlow
};