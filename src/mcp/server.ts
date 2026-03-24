import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { getMemoryById, listMemoriesForPersona } from "../db/memories";
import { personaToolNames, type PersonaToolName } from "./tools/contracts";
import {
  resolvePersonaExecutionPolicy,
  type PersonaExecutionMode,
  type PersonaExecutionPolicy
} from "../runtime/config";
import { memoryKinds } from "../shared/types/memory";
import { handleGetMemoryEvidence } from "./handlers/memory-evidence";
import { type PersonaMcpHandlerContext } from "./handlers/index";
import { handleGetDecisionContext } from "./handlers/decision-context";
import { handleGetPersonaCore } from "./handlers/persona-core";
import { handleSearchMemories } from "./handlers/search-memories";
import { handleGetSessionSummary } from "./handlers/session-summary";
import { handleSubmitFeedback } from "./handlers/submit-feedback";

export type PersonaMcpTransport = "stdio" | "http";
export const defaultPersonaId = "persona_demo";

export interface PersonaMcpToolDefinition {
  name: PersonaToolName;
  description: string;
}

export interface PersonaMcpServerDefinition {
  name: string;
  version: string;
  transport: PersonaMcpTransport;
  executionMode: PersonaExecutionMode;
  executionPolicy: PersonaExecutionPolicy;
  tools: PersonaMcpToolDefinition[];
  resources: string[];
}

export interface CreatePersonaMcpServerDefinitionInput {
  transport?: PersonaMcpTransport;
  mode?: PersonaExecutionMode;
}

export interface CreatePersonaMcpSdkServerInput
  extends CreatePersonaMcpServerDefinitionInput {
  defaultPersonaId?: string;
}

export function createPersonaMcpServerDefinition(
  input: CreatePersonaMcpServerDefinitionInput = {}
): PersonaMcpServerDefinition {
  const transport = input.transport ?? "stdio";
  const executionMode = input.mode ?? "auto";

  return {
    name: "persona-lm",
    version: "0.1.0",
    transport,
    executionMode,
    executionPolicy: resolvePersonaExecutionPolicy(executionMode),
    tools: personaToolNames.map((name) => ({
      name,
      description: describeTool(name)
    })),
    resources: [
      "persona://default/core",
      "persona://default/profile",
      "persona://memory/{id}"
    ]
  };
}

function describeTool(name: PersonaToolName): string {
  switch (name) {
    case "search_memories":
      return "Search compiled persona memories relevant to the current query.";
    case "get_decision_context":
      return "Return a single bundled decision context with persona core, relevant rules, playbooks, traces, and values.";
    case "get_memory_evidence":
      return "Return supporting evidence rows for a memory.";
    case "get_persona_core":
      return "Return the compact core persona context.";
    case "get_session_summary":
      return "Return the current session summary.";
    case "submit_feedback":
      return "Store user feedback for a run and report whether the feedback pipeline triggered a retry.";
  }
}

/**
 * Builds the runtime context that MCP handlers use to resolve persona data and execution policy.
 */
export function createPersonaMcpHandlerContext(
  input: CreatePersonaMcpSdkServerInput = {}
): PersonaMcpHandlerContext {
  return {
    defaultPersonaId: input.defaultPersonaId ?? defaultPersonaId,
    mode: input.mode ?? "auto"
  };
}

/**
 * Creates the real MCP SDK server with tool and resource handlers wired to the current runtime/store.
 */
export function createPersonaMcpSdkServer(
  input: CreatePersonaMcpSdkServerInput = {}
): McpServer {
  const definition = createPersonaMcpServerDefinition(input);
  const context = createPersonaMcpHandlerContext(input);
  const server = new McpServer(
    {
      name: definition.name,
      version: definition.version
    },
    {
      instructions:
        "Use compiled persona memory as the primary context source. Prefer structured memory retrieval over raw evidence. For decision, preference, and value questions, call get_decision_context before answering."
    }
  );

  registerPersonaTools(server, context);
  registerPersonaResources(server, context);

  return server;
}

function registerPersonaTools(
  server: McpServer,
  context: PersonaMcpHandlerContext
): void {
  server.registerTool(
    "search_memories",
    {
      description: describeTool("search_memories"),
      inputSchema: z.object({
        personaId: z.string().optional(),
        query: z.string().min(1),
        kind: z.enum(memoryKinds).optional(),
        topK: z.number().int().min(1).max(20).optional()
      }),
      outputSchema: z.object({
        items: z.array(
          z.object({
            memoryId: z.string(),
            kind: z.enum(memoryKinds),
            summary: z.string(),
            score: z.number(),
            confidence: z.number(),
            matchedTerms: z.array(z.string())
          })
        )
      })
    },
    async (args) => createStructuredToolResult(handleSearchMemories(args, context))
  );

  server.registerTool(
    "get_decision_context",
    {
      description: describeTool("get_decision_context"),
      inputSchema: z.object({
        personaId: z.string().optional(),
        query: z.string().min(1)
      }),
      outputSchema: z.object({
        personaId: z.string(),
        query: z.string(),
        personaCore: z.object({
          styleRules: z.array(z.string()),
          decisionRules: z.array(z.string()),
          values: z.array(z.string()),
          preferences: z.array(z.string()),
          selfDescriptions: z.array(z.string())
        }),
        playbooks: z.array(
          z.object({
            memoryId: z.string(),
            summary: z.string(),
            canonicalText: z.string(),
            score: z.number(),
            confidence: z.number(),
            matchedTerms: z.array(z.string()),
            trigger: z.string().nullable(),
            steps: z.array(z.string()),
            exceptions: z.array(z.string()),
            tradeoffAxes: z.array(
              z.object({
                axis: z.string(),
                preferredSide: z.string(),
                reason: z.string()
              })
            )
          })
        ),
        rules: z.array(
          z.object({
            memoryId: z.string(),
            summary: z.string(),
            canonicalText: z.string(),
            score: z.number(),
            confidence: z.number(),
            matchedTerms: z.array(z.string())
          })
        ),
        traces: z.array(
          z.object({
            memoryId: z.string(),
            summary: z.string(),
            canonicalText: z.string(),
            score: z.number(),
            confidence: z.number(),
            matchedTerms: z.array(z.string()),
            decision: z.string().nullable(),
            reasoning: z.string().nullable(),
            alternatives: z.array(z.string())
          })
        ),
        values: z.array(
          z.object({
            memoryId: z.string(),
            summary: z.string(),
            canonicalText: z.string(),
            score: z.number(),
            confidence: z.number(),
            matchedTerms: z.array(z.string())
          })
        ),
        usedMemoryIds: z.array(z.string())
      })
    },
    async (args) => createStructuredToolResult(handleGetDecisionContext(args, context))
  );

  server.registerTool(
    "get_memory_evidence",
    {
      description: describeTool("get_memory_evidence"),
      inputSchema: z.object({
        memoryId: z.string().min(1)
      }),
      outputSchema: z.object({
        memoryId: z.string(),
        evidence: z.array(
          z.object({
            id: z.string(),
            sourceType: z.string(),
            channel: z.string(),
            authorLabel: z.string(),
            content: z.string(),
            createdAt: z.string().nullable()
          })
        )
      })
    },
    async (args) => createStructuredToolResult(handleGetMemoryEvidence(args, context))
  );

  server.registerTool(
    "get_persona_core",
    {
      description: describeTool("get_persona_core"),
      inputSchema: z.object({
        personaId: z.string().optional()
      }),
      outputSchema: z.object({
        personaId: z.string(),
        styleRules: z.array(z.string()),
        decisionRules: z.array(z.string()),
        values: z.array(z.string()),
        preferences: z.array(z.string()),
        selfDescriptions: z.array(z.string())
      })
    },
    async (args) => createStructuredToolResult(handleGetPersonaCore(args, context))
  );

  server.registerTool(
    "get_session_summary",
    {
      description: describeTool("get_session_summary"),
      inputSchema: z.object({
        personaId: z.string().optional(),
        sessionId: z.string().optional()
      }),
      outputSchema: z.object({
        personaId: z.string(),
        sessionId: z.string().nullable(),
        available: z.boolean(),
        summary: z
          .object({
            currentGoal: z.string().nullable(),
            activeTopics: z.array(z.string()),
            recentCommitments: z.array(z.string()),
            updatedAt: z.string().nullable()
          })
          .nullable()
      })
    },
    async (args) => createStructuredToolResult(handleGetSessionSummary(args, context))
  );

  server.registerTool(
    "submit_feedback",
    {
      description: describeTool("submit_feedback"),
      inputSchema: z.object({
        personaId: z.string().optional(),
        query: z.string().min(1),
        score: z.number().min(0).max(1),
        reason: z.enum([
          "missing_memory",
          "wrong_priority",
          "too_confident",
          "style_mismatch",
          "other"
        ]),
        missingAspect: z.string().optional(),
        note: z.string().optional(),
        sessionId: z.string().optional()
      }),
      outputSchema: z.object({
        runId: z.string(),
        retryTriggered: z.boolean(),
        retryReason: z
          .enum(["user_feedback", "low_confidence"])
          .nullable(),
        finalAttemptNumber: z.number().int(),
        attemptCount: z.number().int()
      })
    },
    async (args) => createStructuredToolResult(handleSubmitFeedback(args, context))
  );
}

function registerPersonaResources(
  server: McpServer,
  context: PersonaMcpHandlerContext
): void {
  server.registerResource(
    "persona-core",
    "persona://default/core",
    {
      description: "Default persona core derived from stable long-term memory."
    },
    async () =>
      createJsonResource(
        "persona://default/core",
        handleGetPersonaCore({}, context)
      )
  );

  server.registerResource(
    "persona-profile",
    "persona://default/profile",
    {
      description: "Default persona profile summary backed by current long-term memory."
    },
    async () =>
      createJsonResource("persona://default/profile", {
        personaId: context.defaultPersonaId,
        executionMode: context.mode,
        memoryCount: listMemoriesForPersona({
          personaId: context.defaultPersonaId,
          client: context.client
        }).length,
        core: handleGetPersonaCore({}, context)
      })
  );

  server.registerResource(
    "persona-memory",
    new ResourceTemplate("persona://memory/{id}", {
      list: undefined
    }),
    {
      description: "Read a specific compiled memory by id."
    },
    async (_uri, variables) => {
      const memoryId = String(variables.id ?? "");
      const memory = getMemoryById({
        id: memoryId,
        client: context.client
      });

      if (memory === null) {
        throw new Error(`Memory not found: ${memoryId}`);
      }

      return createJsonResource(`persona://memory/${memoryId}`, memory);
    }
  );
}

function createStructuredToolResult<T extends object>(data: T) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2)
      }
    ],
    structuredContent: data
  };
}

function createJsonResource<T extends object>(uri: string, data: T) {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}
