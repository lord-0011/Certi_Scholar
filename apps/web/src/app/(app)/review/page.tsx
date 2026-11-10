'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { post } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { usePaged } from '@/lib/usePaged';
import { dateTime, docType } from '@/lib/format';
import { useMe } from '@/components/AppShell';
import { Card, Empty, ErrorText, Loading, PageHead, Pagination, Stat, StatusPill } from '@/components/ui';

interface QueueItem {
  id: string;
  documentType: string | null;
  status: string;
  reason: 'field_review' | 'processing_failed' | 'verification';
  pendingFields: number;
  assignedTo: string | null;
  createdAt: string;
}

interface QueueSummary { total: number; mine: number; unassigned: number; pendingFields: number }

const REASON = { field_review: 'Field review', processing_failed: 'Processing failed', verification: 'Verification' };
const always = () => true;

export default function ReviewQueuePage() {
  const me = useMe();
  const router = useRouter();
  const [assigned, setAssigned] = useState('');
  const [reason, setReason] = useState('');
  const [sort, setSort] = useState('oldest');
  const query = new URLSearchParams({ sort, ...(assigned && { assigned }), ...(reason && { reason }) });
  const list = usePaged<QueueItem>(`/documents/review-queue?${query}`, { pollMs: 10_000, pollWhile: always });
  const summary = useApi<QueueSummary>('/documents/review-queue/summary', { pollMs: 10_000, pollWhile: always });
  const { data, error, loading, reload } = list;
  const [actionError, setActionError] = useState<string>();

  const open = async (item: QueueItem) => {
    setActionError(undefined);
    try {
      if (me.role === 'verifier' && item.assignedTo !== me.id) await post(`/documents/${item.id}/claim`);
      router.push(`/documents/${item.id}`);
    } catch (e) {
      setActionError((e as Error).message);
      void reload();
      void summary.reload();
    }
  };

  const s = summary.data;
  const filtered = Boolean(assigned || reason);

  return (
    <>
      <PageHead title="Review queue" subtitle="Fields below the confidence threshold, failed processing and pending verification. Claim a case to open its content." />
      <div className="stat-strip" style={{ marginBottom: 16 }}>
        <Stat label="Open cases" value={s?.total ?? '—'} icon="check" hint="Across the whole queue" />
        <Stat label="Assigned to me" value={s?.mine ?? '—'} icon="user" tone={s?.mine ? 'info' : undefined} hint="Claimed by you, not yet completed" />
        <Stat label="Unassigned" value={s?.unassigned ?? '—'} icon="users" tone={s?.unassigned ? 'warning' : undefined} hint="Waiting for someone to claim them" />
        <Stat label="Fields awaiting review" value={s?.pendingFields ?? '—'} icon="list" hint="Below the confidence threshold" />
      </div>
      <ErrorText error={error ?? summary.error ?? actionError} />
      <Card
        flush
        title="Cases"
        actions={
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <select className="select" style={{ width: 170 }} value={assigned} onChange={(e) => setAssigned(e.target.value)} aria-label="Filter by assignment">
              <option value="">All cases</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <select className="select" style={{ width: 180 }} value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Filter by work">
              <option value="">All work</option>
              {Object.entries(REASON).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <select className="select" style={{ width: 150 }} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort order">
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
        }
      >
        {loading ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>{filtered ? 'No cases match these filters.' : 'Nothing is waiting for review.'}</Empty>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Work</th>
                <th>Type</th>
                <th>Pending fields</th>
                <th>Received</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id}>
                  <td className="mono">{d.id.slice(-8).toUpperCase()}</td>
                  <td><StatusPill status={d.status} label={REASON[d.reason]} /></td>
                  <td>{docType(d.documentType)}</td>
                  <td>{d.pendingFields || '—'}</td>
                  <td className="muted">{dateTime(d.createdAt)}</td>
                  <td className="right">
                    <button className="btn btn-sm btn-primary" onClick={() => open(d)}>
                      {d.assignedTo === me.id || me.role === 'admin' ? 'Open' : 'Claim & open'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={list.page} pageSize={list.pageSize} total={list.total} setPage={list.setPage} noun="cases" />
      </Card>
    </>
  );
}
