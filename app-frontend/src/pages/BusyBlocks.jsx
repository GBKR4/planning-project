import { useState } from 'react';
import { differenceInMinutes, format } from 'date-fns';
import { MdAdd, MdDeleteOutline, MdEventBusy, MdSchedule } from 'react-icons/md';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import BusyBlockForm from '../components/blocks/BusyBlockForm';
import { BusyBlocksPageSkeleton } from '../components/common/SkeletonLoader';
import { useBusyBlocks, useCreateBusyBlock, useDeleteBusyBlock } from '../hooks/useBusyBlocks';

const BusyBlocks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: blocks, isLoading } = useBusyBlocks();
  const createBlock = useCreateBusyBlock();
  const deleteBlock = useDeleteBusyBlock();

  const handleCreateBlock = async (data) => {
    await createBlock.mutateAsync(data);
    setIsModalOpen(false);
  };

  const handleDeleteBlock = async (blockId) => {
    if (window.confirm('Are you sure you want to delete this busy block?')) {
      await deleteBlock.mutateAsync(blockId);
    }
  };

  const calculateDuration = (startAt, endAt) => {
    const minutes = differenceInMinutes(new Date(endAt), new Date(startAt));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <Layout>
        <BusyBlocksPageSkeleton />
      </Layout>
    );
  }

  const groupedBlocks =
    blocks?.reduce((accumulator, block) => {
      const date = format(new Date(block.start_at), 'yyyy-MM-dd');
      if (!accumulator[date]) {
        accumulator[date] = [];
      }
      accumulator[date].push(block);
      return accumulator;
    }, {}) || {};

  const sortedDates = Object.keys(groupedBlocks).sort();

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-500">Availability</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">Busy Blocks</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                Mark unavailable time so plans stay realistic and the schedule remains useful.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              <MdAdd className="text-lg" />
              Add Busy Block
            </button>
          </div>
        </section>

        {sortedDates.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-700">
              <MdEventBusy className="text-3xl" />
            </div>
            <p className="mt-4 text-lg font-medium text-gray-900">No busy blocks yet</p>
            <p className="mt-2 text-sm text-gray-500">Add unavailable time to keep your planner accurate.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              <MdAdd className="text-lg" />
              Create Busy Block
            </button>
          </section>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <section key={date} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
                  </h2>
                  <span className="text-sm text-gray-500">{groupedBlocks[date].length} block(s)</span>
                </div>
                <div className="grid gap-4">
                  {groupedBlocks[date]
                    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
                    .map((block) => (
                      <article key={block.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{block.title}</h3>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
                                <MdSchedule className="text-base" />
                                {format(new Date(block.start_at), 'HH:mm')} - {format(new Date(block.end_at), 'HH:mm')}
                              </span>
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                                {calculateDuration(block.start_at, block.end_at)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="self-start rounded-lg border border-gray-200 p-2.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                            title="Delete busy block"
                          >
                            <MdDeleteOutline className="text-lg" />
                          </button>
                        </div>
                      </article>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Busy Block">
          <BusyBlockForm onSubmit={handleCreateBlock} isLoading={createBlock.isPending} />
        </Modal>
      </div>
    </Layout>
  );
};

export default BusyBlocks;
