"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  hasFormPhotoFiles,
  prepareFormPhotosForSubmit,
} from "@/lib/prepareFormPhotosForSubmit";
import { PRODUCT_CATEGORY_OPTIONS } from "@/lib/productCategory";
const FormPhotoField = dynamic(() => import("@/components/FormPhotoField"), {
  ssr: false,
  loading: () => (
    <p className="text-xs text-zinc-500">사진 필드 불러오는 중…</p>
  ),
});

function TabPanel({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  /** 비활성 탭도 DOM에 유지 — 숨긴 탭 필드가 FormData에 포함되어야 다른 탭에서 저장 가능 */
  return (
    <div className={active ? "space-y-4" : "hidden"} aria-hidden={!active}>
      {children}
    </div>
  );
}
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  createFormAction,
  updateComplaintFormAction,
  updateQualityImprovementFormAction,
  updateAbnormalReportFormAction,
  updateWorkCoopFormAction,
  updateSuggestionFormAction,
  type FormActionFailure,
} from "@/app/forms/new/actions";
import type { ComplaintFormDefaults } from "@/lib/complaintFormDefaults";
import type { QualityImprovementDefaults } from "@/lib/qualityImprovementDefaults";
import type { AbnormalReportDefaults } from "@/lib/abnormalReportDefaults";
import type { WorkCoopDefaults } from "@/lib/workCoopDefaults";
import type { SuggestionDefaults } from "@/lib/suggestionDefaults";
import {
  FORM_TYPES,
  FORM_TYPE_LABEL,
  formListHref,
  isFormTypeKey,
  type FormTypeKey,
} from "@/lib/formTypes";

type FormActionState = FormActionFailure | undefined;

export default function NewFormClient({
  departmentOwnerOptions,
  nextComplaintNo,
  nextQualityImprovementNo,
  nextAbnormalReportNo,
  nextWorkCoopNo,
  nextSuggestionNo,
  currentUserName,
  canManageDepartmentOwners = false,
  editFormId,
  editType,
  defaults,
}: {
  departmentOwnerOptions: { id: string; label: string }[];
  /** 신규: 다음 NO 예상 · 수정: 현재 문서 NO */
  nextComplaintNo: string;
  nextQualityImprovementNo?: string;
  nextAbnormalReportNo?: string;
  nextWorkCoopNo?: string;
  nextSuggestionNo?: string;
  currentUserName: string;
  /** 관리자만 부서/담당자 설정 화면으로 안내 */
  canManageDepartmentOwners?: boolean;
  editFormId?: string;
  editType?: FormTypeKey;
  defaults?:
    | ComplaintFormDefaults
    | QualityImprovementDefaults
    | AbnormalReportDefaults
    | WorkCoopDefaults
    | SuggestionDefaults;
}) {
  const searchParams = useSearchParams();
  const selectedType = searchParams.get("type");
  const defaultType = isFormTypeKey(selectedType) ? selectedType : "COMPLAINT";
  const [type, setType] = useState<FormTypeKey>(() =>
    editFormId ? (editType ?? "COMPLAINT") : defaultType
  );
  const isComplaint = type === "COMPLAINT";
  const isQualityImprovement = type === "QUALITY_IMPROVEMENT";
  const isAbnormalReport = type === "ABNORMAL_REPORT";
  const isWorkCoop = type === "WORK_COOP";
  const isSuggestion = type === "SUGGESTION";
  const isAbLike = isAbnormalReport || isWorkCoop;
  const [complaintTab, setComplaintTab] = useState<1 | 2 | 3 | 4 | 5>(1);

  useEffect(() => {
    if (!editFormId || type !== "COMPLAINT") return;
    const raw = window.location.hash.replace(/^#/, "");
    const tabByHash: Record<string, 1 | 2 | 3 | 4 | 5> = {
      "complaint-outside-as": 2,
      "complaint-prod-defect": 3,
      "complaint-prod-cause": 3,
      "complaint-lab-cause": 4,
    };
    const tab = tabByHash[raw];
    if (!tab) return;
    requestAnimationFrame(() => setComplaintTab(tab));
    const run = () => {
      const el = document.getElementById(raw);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLTextAreaElement) {
        el.focus({ preventScroll: true });
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [editFormId, type]);
  const [qiTab, setQiTab] = useState<1 | 2 | 3>(1);
  const [sgTab, setSgTab] = useState<1 | 2>(1);
  const [abTab, setAbTab] = useState<1 | 2 | 3>(1);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoSubmitError, setPhotoSubmitError] = useState<string | null>(null);
  const submitAfterPhotoUpload = useRef(false);

  const base = useMemo(() => defaults ?? {}, [defaults]);
  const complaintBase = base as ComplaintFormDefaults;
  const qiBase = base as QualityImprovementDefaults;
  const abBase = base as AbnormalReportDefaults & WorkCoopDefaults;
  const sgBase = base as SuggestionDefaults;

  /** 접수 일자 기본값: 오늘(로컬) */
  const todayDateInputValue = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const listHref = useMemo(() => {
    if (editFormId) return formListHref(type);
    return formListHref(selectedType);
  }, [editFormId, type, selectedType]);

  const [createState, createAction, createPending] = useActionState<
    FormActionState,
    FormData
  >(createFormAction, undefined);
  const [updateState, updateAction, updatePending] = useActionState<
    FormActionState,
    FormData
  >(updateComplaintFormAction, undefined);
  const [qiUpdateState, qiUpdateAction, qiUpdatePending] = useActionState<
    FormActionState,
    FormData
  >(updateQualityImprovementFormAction, undefined);
  const [abUpdateState, abUpdateAction, abUpdatePending] = useActionState<
    FormActionState,
    FormData
  >(updateAbnormalReportFormAction, undefined);
  const [wcUpdateState, wcUpdateAction, wcUpdatePending] = useActionState<
    FormActionState,
    FormData
  >(updateWorkCoopFormAction, undefined);
  const [sgUpdateState, sgUpdateAction, sgUpdatePending] = useActionState<
    FormActionState,
    FormData
  >(updateSuggestionFormAction, undefined);

  const state = editFormId
    ? type === "QUALITY_IMPROVEMENT"
      ? qiUpdateState
      : type === "ABNORMAL_REPORT"
        ? abUpdateState
        : type === "WORK_COOP"
          ? wcUpdateState
          : type === "SUGGESTION"
            ? sgUpdateState
            : updateState
    : createState;
  const action = editFormId
    ? type === "QUALITY_IMPROVEMENT"
      ? qiUpdateAction
      : type === "ABNORMAL_REPORT"
        ? abUpdateAction
        : type === "WORK_COOP"
          ? wcUpdateAction
          : type === "SUGGESTION"
            ? sgUpdateAction
            : updateAction
    : createAction;
  const pending = editFormId
    ? type === "QUALITY_IMPROVEMENT"
      ? qiUpdatePending
      : type === "ABNORMAL_REPORT"
        ? abUpdatePending
        : type === "WORK_COOP"
          ? wcUpdatePending
          : type === "SUGGESTION"
            ? sgUpdatePending
            : updatePending
    : createPending;

  const saving = pending || photoUploading;

  const draftValues =
    state?.ok === false && state.values ? state.values : undefined;

  const [formRevision, setFormRevision] = useState(0);
  useEffect(() => {
    if (state?.ok === false && state.values) {
      setFormRevision((r) => r + 1);
    }
  }, [state]);

  const complaintVals = useMemo(
    () => ({ ...complaintBase, ...draftValues }),
    [complaintBase, draftValues]
  );
  const qiVals = useMemo(
    () => ({ ...qiBase, ...draftValues }),
    [qiBase, draftValues]
  );
  const abVals = useMemo(
    () => ({ ...abBase, ...draftValues }),
    [abBase, draftValues]
  );
  const sgVals = useMemo(
    () => ({ ...sgBase, ...draftValues }),
    [sgBase, draftValues]
  );

  async function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    if (submitAfterPhotoUpload.current) {
      submitAfterPhotoUpload.current = false;
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!isFirebaseConfigured() || !hasFormPhotoFiles(formData)) {
      return;
    }

    e.preventDefault();
    setPhotoSubmitError(null);
    setPhotoUploading(true);
    const prepared = await prepareFormPhotosForSubmit(formData);
    setPhotoUploading(false);
    if (!prepared.ok) {
      setPhotoSubmitError(prepared.message);
      return;
    }

    submitAfterPhotoUpload.current = true;
    form.requestSubmit();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {editFormId
              ? `${FORM_TYPE_LABEL[type]} 수정`
              : FORM_TYPE_LABEL[type]}
          </h1>
          {isComplaint ||
          isQualityImprovement ||
          isAbLike ||
          isSuggestion ? (
            <p className="mt-1 text-xs text-zinc-500">
              <span className="text-red-600" aria-hidden="true">
                *
              </span>{" "}
              표시는 필수 입력입니다. 저장 시 비어 있는 항목은 아래에 안내됩니다.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {editFormId ? (
            <Link
              className="text-sm font-medium text-zinc-700 underline"
              href={`/forms/${editFormId}`}
            >
              상세 보기
            </Link>
          ) : null}
          <Link className="text-sm font-medium text-zinc-900 underline" href={listHref}>
            목록으로
          </Link>
        </div>
      </div>

      {/* 탭으로 숨긴 패널에도 required가 있으면 브라우저 기본 검증이 막을 수 있어 noValidate 후 서버(Zod) 검증 */}
      <form
        key={`${editFormId ?? "new"}-${type}-${formRevision}`}
        action={action}
        onSubmit={handleFormSubmit}
        noValidate={
          isComplaint ||
          isQualityImprovement ||
          isAbLike ||
          isSuggestion
        }
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
      >
        {editFormId ? (
          <>
            <input type="hidden" name="formId" value={editFormId} />
            <input type="hidden" name="type" value={type} />
          </>
        ) : null}
        <div className="grid gap-4 p-6">
          <div
            className={`grid gap-4 ${
              isComplaint || isQualityImprovement || isAbLike || isSuggestion
                ? "grid-cols-[minmax(0,1fr)_minmax(0,11rem)] items-end"
                : ""
            }`}
          >
            <label className="block min-w-0">
              <span className="text-sm font-medium text-zinc-800">
                서식 종류
              </span>
              {editFormId ? (
                <div className="mt-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
                  {FORM_TYPE_LABEL[type]}
                </div>
              ) : (
                <select
                  name="type"
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                  value={type}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (isFormTypeKey(v)) setType(v);
                  }}
                >
                  {FORM_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              )}
            </label>

            {isComplaint ? (
              <label className="block min-w-0">
                <span className="text-sm font-medium text-zinc-800">NO</span>
                <input
                  readOnly
                  tabIndex={-1}
                  value={nextComplaintNo}
                  aria-readonly
                  className="mt-1 w-full cursor-default rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 outline-none"
                />
              </label>
            ) : isQualityImprovement ? (
              <label className="block min-w-0">
                <span className="text-sm font-medium text-zinc-800">NO</span>
                <input
                  readOnly
                  tabIndex={-1}
                  value={
                    editFormId
                      ? nextComplaintNo
                      : nextQualityImprovementNo ?? ""
                  }
                  aria-readonly
                  className="mt-1 w-full cursor-default rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 outline-none"
                />
              </label>
            ) : isAbnormalReport ? (
              <label className="block min-w-0">
                <span className="text-sm font-medium text-zinc-800">NO</span>
                <input
                  readOnly
                  tabIndex={-1}
                  value={editFormId ? nextComplaintNo : nextAbnormalReportNo ?? ""}
                  aria-readonly
                  className="mt-1 w-full cursor-default rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 outline-none"
                />
              </label>
            ) : isWorkCoop ? (
              <label className="block min-w-0">
                <span className="text-sm font-medium text-zinc-800">NO</span>
                <input
                  readOnly
                  tabIndex={-1}
                  value={editFormId ? nextComplaintNo : nextWorkCoopNo ?? ""}
                  aria-readonly
                  className="mt-1 w-full cursor-default rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 outline-none"
                />
              </label>
            ) : isSuggestion ? (
              <label className="block min-w-0">
                <span className="text-sm font-medium text-zinc-800">NO</span>
                <input
                  readOnly
                  tabIndex={-1}
                  value={editFormId ? nextComplaintNo : nextSuggestionNo ?? ""}
                  aria-readonly
                  className="mt-1 w-full cursor-default rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 outline-none"
                />
              </label>
            ) : null}
          </div>

          {!isComplaint && !isQualityImprovement && !isAbLike && !isSuggestion ? (
            <label className="block">
              <span className="text-sm font-medium text-zinc-800">제목</span>
              <input
                name="title"
                required
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                placeholder="예: 품질개선 요청 — OO공정"
              />
            </label>
          ) : null}

          {isComplaint ? (
            <section className="space-y-4">
              <div className="border-b border-zinc-200 pb-3">
                <div className="-mx-1 flex gap-1 overflow-x-auto">
                  {(
                    [
                      { id: 1 as const, label: "1. 접수" },
                      { id: 2 as const, label: "2. 사외 AS" },
                      { id: 3 as const, label: "3. 생산_처리보고서" },
                      { id: 4 as const, label: "4. 연구소_처리보고서" },
                      { id: 5 as const, label: "5. 회수품처리" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setComplaintTab(t.id)}
                      className={
                        complaintTab === t.id
                          ? "shrink-0 rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
                          : "shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <TabPanel active={complaintTab === 1}>
                <div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-end sm:gap-3">
                    <label className="block min-w-0 sm:col-span-2">
                      <span className="text-xs font-medium text-zinc-800 sm:text-sm">
                        일자
                        <span className="text-red-600" aria-hidden="true">
                          {" "}
                          *
                        </span>
                      </span>
                      <input
                        name="receiptDate"
                        required
                        type="date"
                        defaultValue={
                          complaintVals.receiptDate || todayDateInputValue
                        }
                        className="mt-1 w-full max-w-[9.5rem] min-w-0 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400 sm:rounded-xl sm:px-2.5 sm:py-2"
                      />
                    </label>

                    <label className="block min-w-0 sm:col-span-2">
                      <span className="text-xs font-medium text-zinc-800 sm:text-sm">
                        품목구분
                        <span className="text-red-600" aria-hidden="true">
                          {" "}
                          *
                        </span>
                      </span>
                      <select
                        name="productCategory"
                        required
                        defaultValue={complaintVals.productCategory ?? ""}
                        className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-400 sm:rounded-xl sm:px-2.5 sm:py-2"
                      >
                        <option value="" disabled>
                          선택
                        </option>
                        {PRODUCT_CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block min-w-0 sm:col-span-4">
                      <span className="text-xs font-medium text-zinc-800 sm:text-sm">
                        불만신고 제품명
                        <span className="text-red-600" aria-hidden="true">
                          {" "}
                          *
                        </span>
                      </span>
                      <input
                        name="complaintProductName"
                        type="text"
                        required
                        defaultValue={complaintVals.complaintProductName ?? ""}
                        className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400 sm:rounded-xl sm:px-3 sm:py-2"
                        placeholder="모델명·품번"
                        autoComplete="off"
                      />
                    </label>

                    <label className="block min-w-0 sm:col-span-4">
                      <span className="text-xs font-medium text-zinc-800 sm:text-sm">
                        해당부서 및 담당자
                        <span className="text-red-600" aria-hidden="true">
                          {" "}
                          *
                        </span>
                      </span>
                      {departmentOwnerOptions.length === 0 ? (
                        <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm">
                          목록 없음.{" "}
                          {canManageDepartmentOwners ? (
                            <Link
                              href="/admin/department-owners"
                              className="font-medium underline"
                            >
                              관리자 설정
                            </Link>
                          ) : (
                            <span className="font-medium">
                              관리자에게 등록을 요청하세요.
                            </span>
                          )}
                        </div>
                      ) : (
                        <select
                          name="departmentOwnerOptionId"
                          required
                          className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-400 sm:rounded-xl sm:px-3 sm:py-2"
                          defaultValue={
                            complaintVals.departmentOwnerOptionId ||
                            departmentOwnerOptions[0]?.id ||
                            ""
                          }
                        >
                          {departmentOwnerOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </label>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">
                    {canManageDepartmentOwners ? (
                      <>
                        부서/담당자 항목 추가·삭제는{" "}
                        <Link
                          href="/admin/department-owners"
                          className="font-medium text-zinc-700 underline"
                        >
                          관리자 설정
                        </Link>
                        에서 할 수 있습니다.
                      </>
                    ) : (
                      <>
                        부서/담당자 목록은 관리자가 설정합니다. 변경이 필요하면
                        관리자에게 요청하세요.
                      </>
                    )}
                  </p>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    고객정보 (업체/고객명/연락처)
                    <span className="text-red-600" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  </span>
                  <input
                    name="customerInfo"
                    required
                    defaultValue={complaintVals.customerInfo ?? ""}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    placeholder="예: ABC상사 / 김철수 / 010-1234-5678"
                  />
                </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-800">
                  세부품명 및 불만신고내용
                  <span className="text-red-600" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </span>
                <textarea
                  name="productAndComplaint"
                  required
                  rows={5}
                  defaultValue={complaintVals.productAndComplaint ?? ""}
                  className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                  placeholder="세부품명, 불만 내용, 발생 상황 등을 입력"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-800">
                  불만제품 제조번호 / 제조일자 / 작업자
                  <span className="text-red-600" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </span>
                <input
                  name="productManufacturing"
                  type="text"
                  required
                  defaultValue={complaintVals.productManufacturing ?? ""}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                  placeholder="예: SN-001 · 2026-05-09 · 홍길동"
                  autoComplete="off"
                />
              </label>

              <FormPhotoField
                label="사진첨부"
                fileField="photoFile"
                urlField="photoUrlDirect"
                removeField="photoRemove"
                defaultPhoto={complaintVals.receiptPhoto}
              />

              <label className="block">
                <span className="text-sm font-medium text-zinc-800">
                  조치내용
                </span>
                <textarea
                  name="actionContent"
                  rows={2}
                  defaultValue={complaintVals.actionContent ?? ""}
                  className="mt-1 max-h-28 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                />
              </label>
              </TabPanel>

              <TabPanel active={complaintTab === 2}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                  <label className="block min-w-0 lg:col-span-2">
                    <span className="text-sm font-medium text-zinc-800">
                      사외 AS 일자
                    </span>
                    <input
                      name="outsideAsDate"
                      type="date"
                      defaultValue={complaintVals.outsideAsDate ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                  <label className="block min-w-0 lg:col-span-2">
                    <span className="text-sm font-medium text-zinc-800">
                      실시자
                    </span>
                    <input
                      name="outsideAsExecutor"
                      type="text"
                      defaultValue={complaintVals.outsideAsExecutor ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 홍길동"
                      autoComplete="off"
                    />
                  </label>
                  <label className="block min-w-0 sm:col-span-2 lg:col-span-6">
                    <span className="text-sm font-medium text-zinc-800">
                      장소
                    </span>
                    <input
                      name="outsideAsPlace"
                      type="text"
                      defaultValue={complaintVals.outsideAsPlace ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: OO공장 2라인"
                      autoComplete="off"
                    />
                  </label>
                  <label className="block min-w-0 lg:col-span-2">
                    <span className="text-sm font-medium text-zinc-800">
                      소요시간
                    </span>
                    <input
                      name="outsideAsDuration"
                      type="text"
                      defaultValue={complaintVals.outsideAsDuration ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 2시간 30분"
                      autoComplete="off"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    사외 AS 실시내용 및 결과
                  </span>
                  <textarea
                    id="complaint-outside-as"
                    name="outsideAsContentResult"
                    rows={6}
                    defaultValue={complaintVals.outsideAsContentResult ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    placeholder="실시 내용, 조치 결과 등을 입력"
                  />
                </label>

                <FormPhotoField
                  label="관련사진"
                  fileField="outsideAsPhotoFile"
                  urlField="outsideAsPhotoUrlDirect"
                  removeField="outsideAsPhotoRemove"
                  defaultPhoto={complaintVals.outsideAsPhoto}
                />
              </TabPanel>

              <TabPanel active={complaintTab === 3}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                  <label className="block min-w-0">
                    <span className="text-sm font-medium text-zinc-800">
                      불량제품 회수일자
                    </span>
                    <input
                      name="prodDefectRecoveryDate"
                      type="date"
                      defaultValue={complaintVals.prodDefectRecoveryDate ?? ""}
                      className="mt-1 w-full min-w-0 rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className="text-sm font-medium text-zinc-800">
                      원인분석 일자
                    </span>
                    <input
                      name="prodCauseAnalysisDate"
                      type="date"
                      defaultValue={complaintVals.prodCauseAnalysisDate ?? ""}
                      className="mt-1 w-full min-w-0 rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                  <label className="block min-w-0 md:min-w-[12rem]">
                    <span className="text-sm font-medium text-zinc-800">
                      회수품 제조년월 / 작업자 / Ins&apos;NO
                    </span>
                    <input
                      name="prodRecoveredManufacturingInfo"
                      type="text"
                      defaultValue={complaintVals.prodRecoveredManufacturingInfo ?? ""}
                      className="mt-1 w-full min-w-0 rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 2026-03 · 김OO · INS-10234"
                      autoComplete="off"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    회수품 동작 · 외관 등 불량현상
                  </span>
                  <textarea
                    id="complaint-prod-defect"
                    name="prodRecoveredOperationAppearance"
                    rows={5}
                    defaultValue={complaintVals.prodRecoveredOperationAppearance ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    placeholder="회수품 동작 및 외관·기타 불량현상을 함께 기술"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    불량 원인분석
                  </span>
                  <textarea
                    id="complaint-prod-cause"
                    name="prodDefectCauseAnalysis"
                    rows={4}
                    defaultValue={complaintVals.prodDefectCauseAnalysis ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                  />
                </label>

                <FormPhotoField
                  label="원인분석 참고사진"
                  fileField="prodCauseRefPhotoFile"
                  urlField="prodCauseRefPhotoUrlDirect"
                  removeField="prodCauseRefPhotoRemove"
                  defaultPhoto={complaintVals.prodCauseRefPhoto}
                />

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    재발방지 대책
                  </span>
                  <textarea
                    name="prodRecurrencePrevention"
                    rows={4}
                    defaultValue={complaintVals.prodRecurrencePrevention ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                  />
                </label>

                <FormPhotoField
                  label="재발방지 참고사진"
                  fileField="prodRecurrenceRefPhotoFile"
                  urlField="prodRecurrenceRefPhotoUrlDirect"
                  removeField="prodRecurrenceRefPhotoRemove"
                  defaultPhoto={complaintVals.prodRecurrenceRefPhoto}
                />
              </TabPanel>

              <TabPanel active={complaintTab === 4}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className="text-sm font-medium text-zinc-800">
                      담당자
                    </span>
                    <input
                      name="labChargePerson"
                      type="text"
                      defaultValue={complaintVals.labChargePerson ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="연구소 담당자 성명"
                      autoComplete="off"
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className="text-sm font-medium text-zinc-800">
                      원인분석일자
                    </span>
                    <input
                      name="labCauseAnalysisDate"
                      type="date"
                      defaultValue={complaintVals.labCauseAnalysisDate ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    원인분석
                  </span>
                  <textarea
                    id="complaint-lab-cause"
                    name="labCauseAnalysis"
                    rows={5}
                    defaultValue={complaintVals.labCauseAnalysis ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                  />
                </label>

                <FormPhotoField
                  label="원인분석 참고사진"
                  fileField="labCauseRefPhotoFile"
                  urlField="labCauseRefPhotoUrlDirect"
                  removeField="labCauseRefPhotoRemove"
                  defaultPhoto={complaintVals.labCauseRefPhoto}
                />

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    재발방지대책
                  </span>
                  <textarea
                    name="labRecurrencePrevention"
                    rows={4}
                    defaultValue={complaintVals.labRecurrencePrevention ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                  />
                </label>

                <FormPhotoField
                  label="재발방지대책 참고사진"
                  fileField="labRecurrenceRefPhotoFile"
                  urlField="labRecurrenceRefPhotoUrlDirect"
                  removeField="labRecurrenceRefPhotoRemove"
                  defaultPhoto={complaintVals.labRecurrenceRefPhoto}
                />
              </TabPanel>

              <TabPanel active={complaintTab === 5}>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    처리일자
                  </span>
                  <input
                    name="recoveryProcessingDate"
                    type="date"
                    defaultValue={complaintVals.recoveryProcessingDate ?? ""}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    처리내용
                  </span>
                  <select
                    name="recoveryProcessingContent"
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    defaultValue={
                      complaintVals.recoveryProcessingContent || "현상태사용"
                    }
                  >
                    <option value="현상태사용">현상태사용</option>
                    <option value="수리">수리</option>
                    <option value="부품교체">부품교체</option>
                    <option value="폐기">폐기</option>
                    <option value="기타">기타</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    처리 상세내용
                  </span>
                  <textarea
                    name="recoveryProcessingDetail"
                    rows={5}
                    defaultValue={complaintVals.recoveryProcessingDetail ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    placeholder="처리 절차·비고 등 상세 기술"
                  />
                </label>
              </TabPanel>
            </section>
          ) : isQualityImprovement ? (
            <section className="space-y-4">
              <div className="border-b border-zinc-200 pb-3">
                <div className="-mx-1 flex gap-1 overflow-x-auto">
                  {(
                    [
                      { id: 1 as const, label: "1. 접수" },
                      { id: 2 as const, label: "2. 검토 회신서" },
                      { id: 3 as const, label: "3. 의뢰자 확인" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setQiTab(t.id)}
                      className={
                        qiTab === t.id
                          ? "shrink-0 rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
                          : "shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <TabPanel active={qiTab === 1}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                  <label className="block min-w-0 md:col-span-2">
                    <span className="text-sm font-medium text-zinc-800">
                      일자
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <input
                      name="qiReceiptDate"
                      required
                      type="date"
                      defaultValue={
                        qiVals.qiReceiptDate || todayDateInputValue
                      }
                      className="mt-1 w-full max-w-[9.5rem] rounded-xl border border-zinc-200 px-2.5 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-2">
                    <span className="text-sm font-medium text-zinc-800">
                      작성자
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <input
                      name="qiWriterName"
                      required
                      type="text"
                      defaultValue={qiVals.qiWriterName || currentUserName}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-800 outline-none focus:border-zinc-400"
                      placeholder="작성자"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-2">
                    <span className="text-sm font-medium text-zinc-800">
                      품목구분
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <select
                      name="qiProductCategory"
                      required
                      defaultValue={qiVals.qiProductCategory ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-2 outline-none focus:border-zinc-400"
                    >
                      <option value="" disabled>
                        선택
                      </option>
                      {PRODUCT_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 md:col-span-3">
                    <span className="text-sm font-medium text-zinc-800">
                      의뢰품명/사양
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <input
                      name="qiItemSpec"
                      required
                      type="text"
                      defaultValue={qiVals.qiItemSpec ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 품명 / 규격 / 사양"
                      autoComplete="off"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-3">
                    <span className="text-sm font-medium text-zinc-800">
                      검토부서/담당자
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <input
                      name="qiReviewDepartmentOwner"
                      required
                      type="text"
                      defaultValue={qiVals.qiReviewDepartmentOwner ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 품질팀 / 홍길동"
                      autoComplete="off"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    의뢰사유 및 세부 의뢰내용
                    <span className="text-red-600" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  </span>
                  <textarea
                    name="qiRequestReasonDetails"
                    required
                    rows={6}
                    defaultValue={qiVals.qiRequestReasonDetails ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    placeholder="의뢰 사유, 개선 요청사항, 세부 조건 등을 입력"
                  />
                </label>

                <FormPhotoField
                  label="의뢰내용에 대한 사진 첨부"
                  fileField="qiReceiptPhotoFile"
                  urlField="qiReceiptPhotoUrlDirect"
                  removeField="qiReceiptPhotoRemove"
                  defaultPhoto={qiVals.qiReceiptPhoto}
                />
              </TabPanel>

              <TabPanel active={qiTab === 2}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                  <label className="block min-w-0 md:col-span-3">
                    <span className="text-sm font-medium text-zinc-800">
                      검토일자
                    </span>
                    <input
                      name="qiReviewDate"
                      type="date"
                      defaultValue={qiVals.qiReviewDate || todayDateInputValue}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-9">
                    <span className="text-sm font-medium text-zinc-800">
                      검토예정일자/사유
                    </span>
                    <input
                      name="qiReviewDecisionDateReason"
                      type="text"
                      defaultValue={qiVals.qiReviewDecisionDateReason ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 2026-05-20 / 설비 점검 후 진행"
                      autoComplete="off"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    검토 및 개선 처리 내용
                  </span>
                  <textarea
                    name="qiReviewImprovementContent"
                    rows={6}
                    defaultValue={qiVals.qiReviewImprovementContent ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    placeholder="검토 결과, 개선 내용, 처리 내역 등을 입력"
                  />
                </label>

                <FormPhotoField
                  label="처리내용에 대한 사진 첨부"
                  fileField="qiReviewPhotoFile"
                  urlField="qiReviewPhotoUrlDirect"
                  removeField="qiReviewPhotoRemove"
                  defaultPhoto={qiVals.qiReviewPhoto}
                />
              </TabPanel>

              <TabPanel active={qiTab === 3}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                  <label className="block min-w-0 md:col-span-3">
                    <span className="text-sm font-medium text-zinc-800">
                      확인날짜
                    </span>
                    <input
                      name="qiConfirmDate"
                      type="date"
                      defaultValue={qiVals.qiConfirmDate || todayDateInputValue}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-9">
                    <span className="text-sm font-medium text-zinc-800">
                      확인내용
                    </span>
                    <input
                      name="qiConfirmContent"
                      type="text"
                      defaultValue={qiVals.qiConfirmContent ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 개선 내용 확인 완료"
                      autoComplete="off"
                    />
                  </label>
                </div>
              </TabPanel>
            </section>
          ) : isSuggestion ? (
            <section className="space-y-4">
              <div className="border-b border-zinc-200 pb-3">
                <div className="-mx-1 flex gap-1 overflow-x-auto">
                  {(
                    [
                      { id: 1 as const, label: "1. 제안서" },
                      { id: 2 as const, label: "2. 심사결과서" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSgTab(t.id)}
                      className={
                        sgTab === t.id
                          ? "shrink-0 rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
                          : "shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <TabPanel active={sgTab === 1}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                  <label className="block min-w-0 md:col-span-2">
                    <span className="text-sm font-medium text-zinc-800">
                      작성일자
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <input
                      name="sgProposalDate"
                      required
                      type="date"
                      defaultValue={
                        sgVals.sgProposalDate || todayDateInputValue
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-3">
                    <span className="text-sm font-medium text-zinc-800">
                      작성자
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <input
                      name="sgWriterName"
                      required
                      type="text"
                      defaultValue={sgVals.sgWriterName || currentUserName}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-800 outline-none focus:border-zinc-400"
                      placeholder="작성자"
                      autoComplete="name"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    제안내용
                    <span className="text-red-600" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  </span>
                  <textarea
                    name="sgProposalContent"
                    required
                    rows={6}
                    defaultValue={sgVals.sgProposalContent ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    placeholder="제안 내용을 입력"
                  />
                </label>

                <FormPhotoField
                  label="제안내용에 대한 사진 첨부"
                  fileField="sgProposalPhotoFile"
                  urlField="sgProposalPhotoUrlDirect"
                  removeField="sgProposalPhotoRemove"
                  defaultPhoto={sgVals.sgProposalPhoto}
                />

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    제안효과
                    <span className="text-red-600" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  </span>
                  <textarea
                    name="sgProposalEffect"
                    required
                    rows={4}
                    defaultValue={sgVals.sgProposalEffect ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    placeholder="기대 효과·개선 효과 등을 입력"
                  />
                </label>
              </TabPanel>

              <TabPanel active={sgTab === 2}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                  <label className="block min-w-0 md:col-span-3">
                    <span className="text-sm font-medium text-zinc-800">
                      심사일
                    </span>
                    <input
                      name="sgReviewDate"
                      type="date"
                      defaultValue={
                        sgVals.sgReviewDate || todayDateInputValue
                      }
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-9">
                    <span className="text-sm font-medium text-zinc-800 leading-snug">
                      심사자 Comment_시행여부/처리자/포상금등
                    </span>
                    <input
                      name="sgReviewerComment"
                      type="text"
                      defaultValue={sgVals.sgReviewerComment ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 시행 / 홍길동 / 5만원"
                      autoComplete="off"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                  <label className="block min-w-0 md:col-span-2">
                    <span className="text-sm font-medium text-zinc-800">
                      처리자
                    </span>
                    <input
                      name="sgProcessingHandler"
                      type="text"
                      defaultValue={sgVals.sgProcessingHandler ?? ""}
                      className="mt-1 w-full max-w-[12rem] rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="이름"
                      autoComplete="off"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-3">
                    <span className="text-sm font-medium text-zinc-800">
                      처리(예정)일자
                    </span>
                    <input
                      name="sgProcessingPlannedDate"
                      type="date"
                      defaultValue={sgVals.sgProcessingPlannedDate ?? ""}
                      className="mt-1 w-full max-w-xs rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    처리내용
                  </span>
                  <textarea
                    name="sgProcessingContent"
                    rows={6}
                    defaultValue={sgVals.sgProcessingContent ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    placeholder="심사·처리 결과 및 내용을 입력"
                  />
                </label>

                <FormPhotoField
                  label="처리내용에 대한 사진 첨부"
                  fileField="sgProcessingPhotoFile"
                  urlField="sgProcessingPhotoUrlDirect"
                  removeField="sgProcessingPhotoRemove"
                  defaultPhoto={sgVals.sgProcessingPhoto}
                />
              </TabPanel>
            </section>
          ) : isAbLike ? (
            <section className="space-y-4">
              <div className="border-b border-zinc-200 pb-3">
                <div className="-mx-1 flex gap-1 overflow-x-auto">
                  {(
                    [
                      {
                        id: 1 as const,
                        label: isWorkCoop
                          ? "1. 업무협조"
                          : "1. 이상발생신고",
                      },
                      { id: 2 as const, label: "2. 처리보고서" },
                      {
                        id: 3 as const,
                        label: isWorkCoop
                          ? "3. 요청자확인"
                          : "3. 신고자확인",
                      },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAbTab(t.id)}
                      className={
                        abTab === t.id
                          ? "shrink-0 rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
                          : "shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <TabPanel active={abTab === 1}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                  <label className="block min-w-0 md:col-span-2">
                    <span className="text-sm font-medium text-zinc-800">
                      {isWorkCoop ? "요청일자" : "신고일자"}
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <input
                      name="abReportDate"
                      required
                      type="date"
                      defaultValue={
                        abVals.abReportDate || todayDateInputValue
                      }
                      className="mt-1 w-full max-w-[9.5rem] rounded-xl border border-zinc-200 px-2.5 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-2">
                    <span className="text-sm font-medium text-zinc-800">
                      작성자
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <input
                      name="abWriterName"
                      required
                      type="text"
                      defaultValue={abVals.abWriterName || currentUserName}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-800 outline-none focus:border-zinc-400"
                      placeholder="작성자"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-2">
                    <span className="text-sm font-medium text-zinc-800">
                      품목구분
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <select
                      name="abProductCategory"
                      required
                      defaultValue={abVals.abProductCategory ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-2 outline-none focus:border-zinc-400"
                    >
                      <option value="" disabled>
                        선택
                      </option>
                      {PRODUCT_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 md:col-span-3">
                    <span className="text-sm font-medium text-zinc-800">
                      {isWorkCoop ? "요청품목/사양" : "이상발생품명/사양"}
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <input
                      name="abItemSpec"
                      required
                      type="text"
                      defaultValue={abVals.abItemSpec ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 품명 / 규격 / 사양"
                      autoComplete="off"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-3">
                    <span className="text-sm font-medium text-zinc-800">
                      {isWorkCoop ? "수신부서/담당자" : "처리부서/담당자"}
                      <span className="text-red-600" aria-hidden="true">
                        {" "}
                        *
                      </span>
                    </span>
                    <input
                      name="abHandlingDepartmentOwner"
                      required
                      type="text"
                      defaultValue={abVals.abHandlingDepartmentOwner ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 생산팀 / 홍길동"
                      autoComplete="off"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    {isWorkCoop
                      ? "협조요청내용 및 사유"
                      : "문제점 및 이상현상/요구사항"}
                    <span className="text-red-600" aria-hidden="true">
                      {" "}
                      *
                    </span>
                  </span>
                  <textarea
                    name="abProblemAndRequest"
                    required
                    rows={6}
                    defaultValue={abVals.abProblemAndRequest ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    placeholder={
                      isWorkCoop
                        ? "협조 요청 내용·사유 등을 입력"
                        : "문제점, 이상 현상, 요구사항 등을 입력"
                    }
                  />
                </label>

                <FormPhotoField
                  label={
                    isWorkCoop
                      ? "협조요청에 대한 사진 첨부"
                      : "이상현상 대한 사진 첨부"
                  }
                  fileField="abReportPhotoFile"
                  urlField="abReportPhotoUrlDirect"
                  removeField="abReportPhotoRemove"
                  defaultPhoto={abVals.abReportPhoto}
                />
              </TabPanel>

              <TabPanel active={abTab === 2}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                  <label className="block min-w-0 md:col-span-3">
                    <span className="text-sm font-medium text-zinc-800">
                      처리일자
                    </span>
                    <input
                      name="abHandlingDate"
                      type="date"
                      defaultValue={abVals.abHandlingDate || todayDateInputValue}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-9">
                    <span className="text-sm font-medium text-zinc-800">
                      처리예정일자/사유
                    </span>
                    <input
                      name="abPlannedDateReason"
                      type="text"
                      defaultValue={abVals.abPlannedDateReason ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 2026-05-20 / 부품 수급 후 진행"
                      autoComplete="off"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-800">
                    {isWorkCoop
                      ? "업무협조 처리내용"
                      : "원인 및 시정조치/예방 내용"}
                  </span>
                  <textarea
                    name="abCauseAndActionPrevention"
                    rows={6}
                    defaultValue={abVals.abCauseAndActionPrevention ?? ""}
                    className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    placeholder={
                      isWorkCoop
                        ? "업무협조 처리 내용을 입력"
                        : "원인, 시정조치, 예방 대책 등을 입력"
                    }
                  />
                </label>

                <FormPhotoField
                  label={
                    isWorkCoop
                      ? "처리내용에 대한 사진 첨부"
                      : "조치내용에 대한 사진 첨부"
                  }
                  fileField="abHandlingPhotoFile"
                  urlField="abHandlingPhotoUrlDirect"
                  removeField="abHandlingPhotoRemove"
                  defaultPhoto={abVals.abHandlingPhoto}
                />
              </TabPanel>

              <TabPanel active={abTab === 3}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                  <label className="block min-w-0 md:col-span-3">
                    <span className="text-sm font-medium text-zinc-800">
                      확인날짜
                    </span>
                    <input
                      name="abConfirmDate"
                      type="date"
                      defaultValue={abVals.abConfirmDate || todayDateInputValue}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                    />
                  </label>
                  <label className="block min-w-0 md:col-span-9">
                    <span className="text-sm font-medium text-zinc-800">
                      확인내용
                    </span>
                    <input
                      name="abConfirmContent"
                      type="text"
                      defaultValue={abVals.abConfirmContent ?? ""}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                      placeholder="예: 조치 내용 확인 완료"
                      autoComplete="off"
                    />
                  </label>
                </div>
              </TabPanel>
            </section>
          ) : (
            <>
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">요약</span>
                <textarea
                  name="summary"
                  required
                  rows={3}
                  className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                  placeholder="핵심만 짧게"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-800">상세</span>
                <textarea
                  name="details"
                  rows={8}
                  className="mt-1 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                  placeholder="상황/원인/요청사항/첨부 등 자유기술"
                />
              </label>
            </>
          )}

          {photoSubmitError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {photoSubmitError}
            </div>
          ) : null}
          {state?.ok === false ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {photoUploading
              ? "사진 업로드 중..."
              : pending
                ? "저장 중..."
                : editFormId
                  ? "저장"
                  : "제출"}
          </button>
        </div>
      </form>

    </div>
  );
}

