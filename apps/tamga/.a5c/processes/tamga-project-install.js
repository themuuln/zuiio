/**
 * @process tamga-project-install
 * @description Re-run project-install for Tamga — update profile, re-analyze repo, refresh tool recommendations
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTechStack(techStack) {
	if (!techStack) return "Not analyzed";
	const parts = [];
	if (techStack.languages?.length)
		parts.push(techStack.languages.map((l) => l.name || l).join(", "));
	if (techStack.frameworks?.length)
		parts.push(techStack.frameworks.map((f) => f.name || f).join(", "));
	return parts.length > 0 ? parts.join(" | ") : "Not analyzed";
}

// ============================================================================
// MAIN PROCESS
// ============================================================================

export async function process(inputs, ctx) {
	// PHASE 1: CHECK EXISTING SETUP
	const existingSetup = await ctx.task(checkExistingSetupTask, {
		projectRoot: inputs.projectRoot,
		additionalContext: inputs.additionalContext,
	});

	const detectedNewProject =
		inputs.isNewProject !== null
			? inputs.isNewProject
			: existingSetup.isNewProject;

	// PHASE 2: PROJECT RESEARCH (PARALLEL)
	const [repoStructure, toolsAndServices] = await ctx.parallel.all([
		() =>
			ctx.task(analyzeRepoTask, {
				projectRoot: inputs.projectRoot,
				existingProfile: existingSetup.existingProfile,
			}),
		() =>
			ctx.task(analyzeToolsServicesTask, {
				projectRoot: inputs.projectRoot,
				existingProfile: existingSetup.existingProfile,
			}),
	]);

	// PHASE 3: PROCESS MINING
	const miningResult = await ctx.task(processMiningTask, {
		projectRoot: inputs.projectRoot,
		existingProfile: existingSetup.existingProfile,
		repoStructure,
	});

	// PHASE 4: USER INTERVIEW (BREAKPOINT)
	const interviewResult = await ctx.breakpoint({
		question: [
			"Welcome back to Tamga project setup! We found your existing profile.",
			"",
			"We have re-analyzed the repository and mined its git history. Please provide any updates:",
			"",
			"1. **Project Goals**: Any new or updated goals?",
			"2. **Pain Points**: New pain points or resolved ones?",
			"3. **Workflow Preferences**: Any changes to branch strategy, code review, or release cadence?",
			"4. **CI/CD Needs**: Want to set up or update CI/CD integration?",
			"5. **External Integrations**: Any new tools or services?",
			"6. **Conventions**: Any new coding conventions or standards?",
			"",
			"Answer as much or as little as you like. We will merge with your existing profile.",
		].join("\n"),
		title: "Project Onboarding Update",
		context: {
			runId: ctx.runId,
			existingProfile: "Found existing profile - will merge updates",
			isNewProject: detectedNewProject,
			researchSummary: {
				repoAnalyzed: true,
				toolsAnalyzed: true,
				gitHistoryMined: true,
			},
		},
	});

	if (!interviewResult.approved) {
		return {
			success: false,
			reason: "User cancelled during project onboarding interview",
			feedback: interviewResult.response || interviewResult.feedback,
			metadata: { processId: "tamga-project-install", timestamp: ctx.now() },
		};
	}

	// PHASE 5: PROFILE BUILDING
	const profileResult = await ctx.task(buildProfileTask, {
		existingProfile: existingSetup.existingProfile,
		repoStructure,
		toolsAndServices,
		miningResult,
		additionalContext: inputs.additionalContext,
		projectRoot: inputs.projectRoot,
		isNewProject: detectedNewProject,
	});

	// PHASE 6: TOOL SELECTION
	const toolSelection = await ctx.task(toolSelectionTask, {
		profile: profileResult.profile,
		repoStructure,
		toolsAndServices,
		miningResult,
	});

	// PHASE 7: CI/CD INTEGRATION (CONDITIONAL)
	let cicdResult = null;
	const cicdApproval = await ctx.breakpoint({
		question: [
			"Would you like to set up or update CI/CD integration for babysitter?",
			"",
			profileResult.profile.cicd?.provider
				? `We detected **${profileResult.profile.cicd.provider}**. We can add babysitter steps to your existing pipeline.`
				: "We did not detect an existing CI/CD provider. We can help you set one up.",
			"",
			"- **Yes**: Configure CI/CD integration",
			"- **No**: Skip CI/CD setup for now",
		].join("\n"),
		title: "CI/CD Integration",
		context: {
			runId: ctx.runId,
			detectedProvider: profileResult.profile.cicd?.provider || "none",
			existingPipelines: profileResult.profile.cicd?.pipelines || [],
		},
	});

	if (cicdApproval.approved) {
		cicdResult = await ctx.task(configureCicdTask, {
			profile: profileResult.profile,
			toolSelection,
			projectRoot: inputs.projectRoot,
		});
	}

	// PHASE 8: CLAUDE.MD UPDATES
	const claudeMdResult = await ctx.task(updateClaudeMdTask, {
		profile: profileResult.profile,
		toolSelection,
		cicdResult,
		projectRoot: inputs.projectRoot,
	});

	// PHASE 9: INITIALIZE .a5c INFRASTRUCTURE
	await ctx.task(initializeA5cInfraTask, {
		projectRoot: inputs.projectRoot,
		profile: profileResult.profile,
		toolSelection,
		isNewProject: detectedNewProject,
	});

	// PHASE 10: GITIGNORE CONFIGURATION
	const gitignoreApproval = await ctx.breakpoint({
		question: [
			"**Configure .gitignore for babysitter files**",
			"",
			"Would you like to add babysitter files to `.gitignore`?",
			"",
			"- **Nothing** — Do not modify .gitignore",
			"- **Logs only** (Recommended) — Ignore `.a5c/logs/`",
			"- **Logs + Runs** — Ignore `.a5c/logs/` and `.a5c/runs/`",
			"- **Entire .a5c** — Ignore the entire `.a5c/` directory",
		].join("\n"),
		title: ".gitignore Configuration",
		context: { runId: ctx.runId },
	});

	let gitignoreResult = null;
	if (gitignoreApproval.approved) {
		gitignoreResult = await ctx.task(configureGitignoreTask, {
			projectRoot: inputs.projectRoot,
		});
	}

	// PHASE 11: REVIEW BREAKPOINT
	const profileReview = await ctx.breakpoint({
		question: [
			"Please review the complete project profile before we save it.",
			"",
			`**Project**: ${profileResult.profile.projectName || "Unknown"}`,
			`**Description**: ${profileResult.profile.description || "Not set"}`,
			`**Tech Stack**: ${formatTechStack(profileResult.profile.techStack)}`,
			`**Architecture**: ${profileResult.profile.architecture?.pattern || "Not determined"}`,
			`**Team**: ${(profileResult.profile.team || []).map((m) => m.name).join(", ") || "None specified"}`,
			`**Goals**: ${(profileResult.profile.goals || []).map((g) => g.description).join("; ") || "None set"}`,
			"",
			`**Recommended Skills**: ${(toolSelection.recommendedSkills || []).join(", ") || "Default set"}`,
			`**Recommended Processes**: ${(toolSelection.recommendedProcesses || []).join(", ") || "Default set"}`,
			`**CI/CD**: ${cicdResult ? (cicdResult.configured ? "Yes" : "Skipped") : "Skipped"}`,
			`**CLAUDE.md Updated**: ${claudeMdResult?.updated ? "Yes" : "No"}`,
			"",
			"Approve to save this profile, or provide corrections.",
		].join("\n"),
		title: "Project Profile Review",
		context: { runId: ctx.runId },
	});

	if (!profileReview.approved) {
		return {
			success: false,
			reason: "User rejected project profile at review gate",
			feedback: profileReview.response || profileReview.feedback,
			metadata: { processId: "tamga-project-install", timestamp: ctx.now() },
		};
	}

	// PHASE 12: SAVE
	const saveResult = await ctx.task(saveProfileTask, {
		profile: profileResult.profile,
		toolSelection,
		cicdResult,
		claudeMdResult,
		projectRoot: inputs.projectRoot,
	});

	return {
		success: true,
		profile: saveResult.savedProfile,
		toolsInstalled: toolSelection.recommendedSkills || [],
		claudeMdUpdated: claudeMdResult?.updated || false,
		gitignoreConfigured: gitignoreResult?.configured || false,
		cicdConfigured: cicdResult?.configured || false,
		isNewProject: detectedNewProject,
		isUpdate: !!existingSetup.existingProfile,
		artifacts: {
			profileJson: saveResult.profileJsonPath,
			profileMd: saveResult.profileMdPath,
			claudeMd: claudeMdResult?.claudeMdPath || null,
		},
		metadata: { processId: "tamga-project-install", timestamp: ctx.now() },
	};
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const checkExistingSetupTask = defineTask(
	"check-existing-setup",
	(args, taskCtx) => ({
		kind: "agent",
		title: "Check existing project setup",
		agent: {
			name: "general-purpose",
			prompt: {
				role: "system administrator and configuration specialist",
				task: "Check if a babysitter project profile already exists and determine if this is a new or existing project.",
				context: {
					projectRoot: args.projectRoot,
					additionalContext: args.additionalContext,
				},
				instructions: [
					"Run `babysitter profile:read --project --json` to check for an existing profile",
					"Check if .a5c/ directory exists and list its contents",
					"Determine if this is a new project by checking git history and source code",
					"Check for existing CLAUDE.md and CI/CD configuration files",
					"Do NOT modify any files - this is a read-only check",
					"IMPORTANT: Always use the babysitter CLI for profile operations",
				],
				outputFormat:
					"JSON with existingProfile, isFirstRun, isNewProject, a5cDirExists, a5cFiles, claudeMdExists, cicdConfigFiles, gitCommitCount",
			},
			outputSchema: {
				type: "object",
				required: ["existingProfile", "isFirstRun", "isNewProject"],
			},
		},
		io: {
			inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
			outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
		},
	}),
);

export const analyzeRepoTask = defineTask("analyze-repo", (args, taskCtx) => ({
	kind: "agent",
	title: "Analyze repository structure and code",
	agent: {
		name: "general-purpose",
		prompt: {
			role: "senior software architect and codebase analyst",
			task: "Perform a comprehensive analysis of the repository structure, code organization, documentation, and architecture.",
			context: {
				projectRoot: args.projectRoot,
				existingProfile: args.existingProfile,
			},
			instructions: [
				"Map the complete directory structure",
				"Identify the architectural pattern",
				"Detect programming languages, frameworks, databases, build tools",
				"Identify entry points, data flow, coding conventions",
				"Find and summarize key documentation files",
				"If existing profile is provided, focus on finding changes or additions",
			],
			outputFormat:
				"JSON with architecture, techStack, conventions, documentation",
		},
		outputSchema: {
			type: "object",
			required: ["architecture", "techStack", "conventions"],
		},
	},
	io: {
		inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
		outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
	},
}));

export const analyzeToolsServicesTask = defineTask(
	"analyze-tools-services",
	(args, taskCtx) => ({
		kind: "agent",
		title: "Analyze tools, services, and workflows",
		agent: {
			name: "general-purpose",
			prompt: {
				role: "DevOps engineer and platform specialist",
				task: "Analyze the project to identify all tools, services, CI/CD configuration, workflows, and external integrations.",
				context: {
					projectRoot: args.projectRoot,
					existingProfile: args.existingProfile,
				},
				instructions: [
					"Identify all development tools configured in the project",
					"Identify CI/CD configuration",
					"Identify external services referenced in code or config",
					"Identify project workflows",
					"Do NOT access or store any secrets, tokens, or credentials",
				],
				outputFormat:
					"JSON with tools, cicd, services, workflows, externalIntegrations",
			},
			outputSchema: { type: "object", required: ["tools", "workflows"] },
		},
		io: {
			inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
			outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
		},
	}),
);

export const processMiningTask = defineTask(
	"process-mining",
	(args, taskCtx) => ({
		kind: "agent",
		title: "Mine git history for process patterns",
		agent: {
			name: "general-purpose",
			prompt: {
				role: "process mining specialist and software historian",
				task: "Analyze the git history to extract development patterns, implicit rules, evolution trajectory, and bottlenecks.",
				context: {
					projectRoot: args.projectRoot,
					existingProfile: args.existingProfile,
					repoStructure: args.repoStructure,
				},
				instructions: [
					"Analyze git log for commit patterns, branch patterns, release patterns",
					"Identify evolution patterns and major refactoring events",
					"Identify bottlenecks and hidden coupling",
					"Extract implicit rules and pain points",
					"Limit analysis to last 500-1000 commits",
				],
				outputFormat:
					"JSON with commitPatterns, branchPatterns, releasePatterns, evolution, bottlenecks, implicitRules, painPoints",
			},
			outputSchema: {
				type: "object",
				required: ["commitPatterns", "bottlenecks"],
			},
		},
		io: {
			inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
			outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
		},
	}),
);

export const buildProfileTask = defineTask(
	"build-profile",
	(args, taskCtx) => ({
		kind: "agent",
		title: "Build comprehensive project profile",
		agent: {
			name: "general-purpose",
			prompt: {
				role: "project profile architect and data integration engineer",
				task: "Build a comprehensive ProjectProfile by merging all available information sources.",
				context: {
					existingProfile: args.existingProfile,
					repoStructure: args.repoStructure,
					toolsAndServices: args.toolsAndServices,
					miningResult: args.miningResult,
					additionalContext: args.additionalContext,
					projectRoot: args.projectRoot,
					isNewProject: args.isNewProject,
				},
				instructions: [
					"If existing profile exists, use as base and merge new information on top",
					"Incorporate repo structure, tools, mining results, and user interview responses",
					"Write preview to artifacts/project-profile-preview.json",
					"Do NOT write to .a5c/project-profile.json directly",
				],
				outputFormat: "JSON with profile, changesSummary, sourcesUsed",
			},
			outputSchema: { type: "object", required: ["profile", "changesSummary"] },
		},
		io: {
			inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
			outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
		},
	}),
);

export const toolSelectionTask = defineTask(
	"tool-selection",
	(args, taskCtx) => ({
		kind: "agent",
		title: "Select optimal tools and processes for project",
		agent: {
			name: "general-purpose",
			prompt: {
				role: "developer tools expert and productivity consultant",
				task: "Analyze the project profile and recommend optimal babysitter tools, agents, processes, and skills.",
				context: {
					profile: args.profile,
					repoStructure: args.repoStructure,
					toolsAndServices: args.toolsAndServices,
					miningResult: args.miningResult,
				},
				instructions: [
					"Match project characteristics against available process categories",
					"Recommend specific processes and methodology",
					"Recommend skills and agents based on project needs",
					"Write recommendations to artifacts/tool-recommendations.json",
				],
				outputFormat:
					"JSON with recommendedProcesses, recommendedSkills, recommendedAgents, recommendedMethodology, justifications",
			},
			outputSchema: {
				type: "object",
				required: [
					"recommendedProcesses",
					"recommendedSkills",
					"recommendedMethodology",
				],
			},
		},
		io: {
			inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
			outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
		},
	}),
);

export const configureCicdTask = defineTask(
	"configure-cicd",
	(args, taskCtx) => ({
		kind: "agent",
		title: "Configure CI/CD integration",
		agent: {
			name: "general-purpose",
			prompt: {
				role: "CI/CD engineer and DevOps automation specialist",
				task: "Configure babysitter CI/CD integration for the project.",
				context: {
					profile: args.profile,
					toolSelection: args.toolSelection,
					projectRoot: args.projectRoot,
				},
				instructions: [
					"If no provider detected, recommend GitHub Actions",
					"Generate CI/CD configuration file(s)",
					"Configure triggers based on user preferences",
					"Do NOT hardcode secrets",
				],
				outputFormat:
					"JSON with configured, provider, configFilesWritten, triggerEvents, processIds",
			},
			outputSchema: { type: "object", required: ["configured"] },
		},
		io: {
			inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
			outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
		},
	}),
);

export const updateClaudeMdTask = defineTask(
	"update-claude-md",
	(args, taskCtx) => ({
		kind: "agent",
		title: "Update CLAUDE.md with babysitter instructions",
		agent: {
			name: "general-purpose",
			prompt: {
				role: "technical writer and configuration specialist",
				task: "Update the project CLAUDE.md to include babysitter processes, commands, and instructions.",
				context: {
					profile: args.profile,
					toolSelection: args.toolSelection,
					cicdResult: args.cicdResult,
					projectRoot: args.projectRoot,
				},
				instructions: [
					"Read existing CLAUDE.md if it exists",
					"Add a babysitter section with processes, commands, and project-specific configuration",
					"Do not remove existing content",
					"Write the updated CLAUDE.md",
				],
				outputFormat: "JSON with updated (boolean), path, sectionsAdded",
			},
			outputSchema: { type: "object", required: ["updated"] },
		},
		io: {
			inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
			outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
		},
	}),
);

export const initializeA5cInfraTask = defineTask(
	"initialize-a5c-infra",
	(args, taskCtx) => ({
		kind: "agent",
		title: "Initialize .a5c infrastructure",
		agent: {
			name: "general-purpose",
			prompt: {
				role: "infrastructure engineer",
				task: "Initialize .a5c/package.json and quality-gates.json if they do not exist.",
				context: {
					projectRoot: args.projectRoot,
					profile: args.profile,
					toolSelection: args.toolSelection,
				},
				instructions: [
					"Check if .a5c/package.json exists, create if not",
					"Check if .a5c/quality-gates.json exists, create if not",
					"Install babysitter-sdk in .a5c/ if not already installed",
				],
				outputFormat: "JSON with initialized (boolean), filesCreated (array)",
			},
			outputSchema: { type: "object", required: ["initialized"] },
		},
		io: {
			inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
			outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
		},
	}),
);

export const configureGitignoreTask = defineTask(
	"configure-gitignore",
	(args, taskCtx) => ({
		kind: "agent",
		title: "Configure .gitignore for babysitter files",
		agent: {
			name: "general-purpose",
			prompt: {
				role: "git configuration specialist",
				task: "Update .gitignore based on user preferences for babysitter file exclusion.",
				context: { projectRoot: args.projectRoot },
				instructions: [
					"Read existing .gitignore",
					"Add babysitter-specific exclusions based on user preference level",
					"Always add credential exclusions (.a5c/creds.env)",
					"Write updated .gitignore",
				],
				outputFormat:
					"JSON with configured (boolean), level (string), linesAdded (number)",
			},
			outputSchema: { type: "object", required: ["configured", "level"] },
		},
		io: {
			inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
			outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
		},
	}),
);

export const saveProfileTask = defineTask("save-profile", (args, taskCtx) => ({
	kind: "agent",
	title: "Save project profile",
	agent: {
		name: "general-purpose",
		prompt: {
			role: "data persistence specialist",
			task: "Save the final project profile using the babysitter CLI.",
			context: {
				profile: args.profile,
				toolSelection: args.toolSelection,
				cicdResult: args.cicdResult,
				claudeMdResult: args.cudeMdResult,
				projectRoot: args.projectRoot,
			},
			instructions: [
				"Write the profile to a temp JSON file",
				"Use `babysitter profile:write --project --input <file> --json` to save",
				"Also generate .a5c/project-profile.md for human readability",
				"Report the saved paths",
			],
			outputFormat: "JSON with savedProfile, profileJsonPath, profileMdPath",
		},
		outputSchema: {
			type: "object",
			required: ["savedProfile", "profileJsonPath", "profileMdPath"],
		},
	},
	io: {
		inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
		outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
	},
}));
