import 'server-only';
import { searchAgentPlanSchema, type SearchAgentPlan } from './search-agent.schemas';
import { PlannerFailure, type OrchestratorDecision, type OrchestratorRequest } from './orchestrator.schemas';

/** IDs emitted by a model are never authority to fetch an unrelated movie. */
export function compileOrchestratorPlan(decision: OrchestratorDecision, request: OrchestratorRequest): SearchAgentPlan {
  if (decision.movieId !== null && decision.movieId !== request.referenceMovieId) {
    throw new PlannerFailure('invalid_plan');
  }
  switch (decision.intent) {
    case 'search':
    case 'clarify_movie':
      return searchAgentPlanSchema.parse({ calls: [...new Set(decision.queries)].map(query => ({ tool: 'search_movies', query })) });
    case 'trending':
      return searchAgentPlanSchema.parse({ calls: [{ tool: 'get_trending', window: decision.window }] });
    case 'details':
    case 'credits':
      return searchAgentPlanSchema.parse({ calls: [
        { tool: 'get_movie_details', movieId: String(decision.movieId) },
        { tool: 'get_credits', movieId: String(decision.movieId) },
      ] });
    case 'recommendations':
      return searchAgentPlanSchema.parse({ calls: [{ tool: 'get_recommendations', movieId: String(decision.movieId) }] });
    default:
      throw new PlannerFailure('invalid_plan');
  }
}
