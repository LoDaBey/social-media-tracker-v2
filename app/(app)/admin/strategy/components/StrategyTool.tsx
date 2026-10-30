"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCreateStrategyProject } from "@/hooks/useCreateStrategyProject";
import { useDeleteStrategyProject } from "@/hooks/useDeleteStrategyProject";
import { useImportStrategyExcel } from "@/hooks/useImportStrategyExcel";
import { useSaveStrategyProject } from "@/hooks/useSaveStrategyProject";
import { strategyHrefForProject } from "@/lib/strategy-tabs";
import { StrategyBookTabs } from "./StrategyBookTabs";
import { StrategyDeleteProjectModal } from "./StrategyDeleteProjectModal";
import { StrategyEmptyState } from "./StrategyEmptyState";
import { StrategyNewProjectButton } from "./StrategyNewProjectButton";
import { StrategyNewProjectModal } from "./StrategyNewProjectModal";
import { StrategyProjectPanel } from "./StrategyProjectPanel";
import { StrategyUploadButton } from "./StrategyUploadButton";
import type {
  StrategyCreateProjectInput,
  StrategySaveProjectInput,
  StrategyToolProps,
} from "@/types/strategy";

export function StrategyTool({
  selectedSlug,
  projects,
  activeProject,
  regionOptions,
}: StrategyToolProps) {
  const router = useRouter();
  const { importExcel, pending: importing } = useImportStrategyExcel();
  const { createProject, pending: creating } = useCreateStrategyProject();
  const { saveProject, pending: savingProject } = useSaveStrategyProject();
  const { deleteProject, pending: deleting } = useDeleteStrategyProject();
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    const result = await importExcel(file);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  async function handleCreateProject(input: StrategyCreateProjectInput) {
    setCreateError(null);
    const result = await createProject(input);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }
    toast.success(`${result.project.name} created.`);
    setCreateOpen(false);
    router.push(strategyHrefForProject(result.project.slug));
    router.refresh();
  }

  async function handleSaveProject(input: StrategySaveProjectInput) {
    const result = await saveProject(input);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    toast.success(`${activeProject?.name ?? "Project"} saved.`);
    router.refresh();
    return true;
  }

  async function handleDeleteProject() {
    if (!activeProject) return;
    setDeleteError(null);
    const result = await deleteProject(activeProject.slug);
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    const remaining = projects.filter((item) => item.slug !== activeProject.slug);
    toast.success(`${activeProject.name} deleted.`);
    setDeleteOpen(false);
    if (remaining[0]) {
      router.push(strategyHrefForProject(remaining[0].slug));
    } else {
      router.push("/admin/strategy");
    }
    router.refresh();
  }

  function openCreate() {
    setCreateError(null);
    setCreateOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <StrategyBookTabs selectedSlug={selectedSlug} projects={projects} />
          {activeProject ? (
            <p className="text-[13px] text-[var(--color-muted)]">
              <span className="font-semibold tabular-nums text-[var(--color-ink)]">
                {activeProject.totalAccounts}
              </span>
              {" "}
              accounts
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StrategyNewProjectButton onClick={openCreate} />
          <StrategyUploadButton pending={importing} onFile={handleUpload} />
        </div>
      </div>

      {projects.length === 0 ? (
        <StrategyEmptyState onCreate={openCreate} />
      ) : activeProject ? (
        <div className="min-w-0 rounded-[20px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4 sm:p-5">
          <StrategyProjectPanel
            key={activeProject.slug}
            project={activeProject}
            saving={savingProject}
            regionOptions={regionOptions}
            onSave={handleSaveProject}
            onDelete={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          />
        </div>
      ) : (
        <p className="rounded-[20px] border border-[var(--color-hairline)] bg-[var(--color-surface)] px-5 py-12 text-center text-[14px] text-[var(--color-muted)]">
          That project was not found.
        </p>
      )}

      <StrategyNewProjectModal
        open={createOpen}
        pending={creating}
        error={createError}
        regionOptions={regionOptions}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateProject}
      />
      <StrategyDeleteProjectModal
        open={deleteOpen}
        pending={deleting}
        error={deleteError}
        name={activeProject?.name ?? "this project"}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}
