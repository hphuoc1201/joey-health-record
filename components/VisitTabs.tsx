"use client";

import { useState } from "react";
import clsx from "clsx";
import { FileText, ImageIcon, Download } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import type { ClientDoc, DocumentCategory } from "@/lib/types";
import { formatBytes } from "@/lib/format";
import { UploadForm } from "./UploadForm";
import { DeleteButton } from "./DeleteButton";
import { useDeleteDocument } from "@/lib/queries";

export function VisitTabs({
  visitId,
  profileId,
  docs,
  canEdit,
}: {
  visitId: string;
  profileId: string;
  docs: ClientDoc[];
  canEdit: boolean;
}) {
  const [active, setActive] = useState<DocumentCategory>(CATEGORIES[0].key);
  const current = docs.filter((d) => d.category === active);

  return (
    <div>
      {/* Tab bar */}
      <div className="-mx-4 mb-4 flex gap-1 overflow-x-auto px-4">
        {CATEGORIES.map((cat) => {
          const count = docs.filter((d) => d.category === cat.key).length;
          const Icon = cat.icon;
          const isActive = active === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key)}
              className={clsx(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
              {count > 0 && (
                <span
                  className={clsx(
                    "rounded-full px-1.5 text-xs",
                    isActive ? "bg-white/25" : "bg-gray-100 text-gray-500",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {canEdit && (
        <div className="mb-4">
          <UploadForm visitId={visitId} profileId={profileId} category={active} />
        </div>
      )}

      {current.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">
          Chưa có tệp nào trong mục này.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {current.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              visitId={visitId}
              canEdit={canEdit}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function DocCard({
  doc,
  visitId,
  canEdit,
}: {
  doc: ClientDoc;
  visitId: string;
  canEdit: boolean;
}) {
  const isImage = (doc.mime_type ?? "").startsWith("image/");
  const deleteDocument = useDeleteDocument();

  // Supabase signed URLs honor a `download` query param, forcing a save-as
  // (with the original filename) instead of opening in the tab.
  const downloadUrl = `${doc.url}${doc.url.includes("?") ? "&" : "?"}download=${encodeURIComponent(
    doc.file_name,
  )}`;

  return (
    <li className="card group relative overflow-hidden">
      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="flex aspect-square items-center justify-center bg-gray-50">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.url}
              alt={doc.file_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <FileText className="h-10 w-10 text-gray-300" />
          )}
        </div>
        {doc.size_bytes ? (
          <span className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
            {formatBytes(doc.size_bytes)}
          </span>
        ) : null}
      </a>

      <div className="flex items-center gap-1.5 border-t border-gray-100 px-2.5 py-2">
        {isImage ? (
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        ) : (
          <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        )}
        <span className="min-w-0 flex-1 truncate text-xs text-gray-700">
          {doc.file_name}
        </span>
        <a
          href={downloadUrl}
          download={doc.file_name}
          onClick={(e) => e.stopPropagation()}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
          title="Tải xuống"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>

      {canEdit && (
        <div className="absolute right-1.5 top-1.5">
          <div className="rounded-md bg-white/90 shadow-sm">
            <DeleteButton
              action={async () => {
                await deleteDocument.mutateAsync({
                  documentId: doc.id,
                  storagePath: doc.storage_path,
                  visitId,
                });
              }}
              confirmText={`Xóa tệp "${doc.file_name}"?`}
            />
          </div>
        </div>
      )}
    </li>
  );
}
