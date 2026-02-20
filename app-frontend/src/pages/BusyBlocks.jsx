import { useState } from 'react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import BusyBlockForm from '../components/blocks/BusyBlockForm';
import { BusyBlocksPageSkeleton } from '../components/common/SkeletonLoader';
import { useBusyBlocks, useCreateBusyBlock, useDeleteBusyBlock } from '../hooks/useBusyBlocks';
import { format, differenceInMinutes } from 'date-fns';

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

  // Group blocks by date
  const groupedBlocks = blocks?.reduce((acc, block) => {
    const date = format(new Date(block.start_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(block);
    return acc;
  }, {}) || {};

  const sortedDates = Object.keys(groupedBlocks).sort();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Vibrant Orange to Red Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-r from-red-500 via-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-8 shadow-2xl">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center space-x-3 drop-shadow-lg">
                <span className="text-5xl animate-bounce">🚫</span>
                <span>Busy Blocks</span>
              </h1>
              <p className="mt-2 text-white text-lg drop-shadow-md">Mark times when you're unavailable</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-white text-orange-600 rounded-2xl hover:bg-yellow-50 transition-all duration-300 font-black shadow-2xl hover:shadow-3xl hover:-translate-y-2 hover:scale-110 flex items-center space-x-2"
            >
              <span className="text-2xl">➕</span>
              <span>Add Busy Block</span>
            </button>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-yellow-300 opacity-30 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-40 w-40 rounded-full bg-red-300 opacity-30 blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-white opacity-20 blur-3xl"></div>
        </div>

        {/* Blocks List */}
        {sortedDates.length === 0 ? (
          <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl shadow-2xl border-2 border-orange-200 p-16 text-center">
            <div className="mb-6">
              <div className="mx-auto w-28 h-28 bg-gradient-to-br from-red-400 via-orange-500 to-yellow-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <span className="text-6xl">🚫</span>
              </div>
            </div>
            <p className="text-gray-700 text-2xl font-bold mb-6">🎉 No busy blocks yet!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white rounded-2xl hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 transition-all duration-300 font-black shadow-xl hover:shadow-2xl hover:-translate-y-2 hover:scale-110"
            >
              ✨ Add Your First Busy Block
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date} className="space-y-5">
                {/* Date Header */}
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent flex items-center space-x-2">
                  <span>📅</span>
                  <span>{format(new Date(date), 'EEEE, MMMM dd, yyyy')}</span>
                </h2>

                {/* Blocks for this date */}
                <div className="grid grid-cols-1 gap-5">
                  {groupedBlocks[date]
                    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
                    .map((block) => (
                      <div
                        key={block.id}
                        className="group bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 rounded-2xl shadow-xl border-l-[8px] border-gradient-to-b from-red-500 to-orange-500 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] border-orange-500"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors flex items-center space-x-2">
                              <span className="text-2xl">🚫</span>
                              <span>{block.title}</span>
                            </h3>
                            <div className="flex items-center space-x-6 mt-4">
                              <span className="text-base font-semibold text-gray-700 flex items-center space-x-1.5 bg-white px-3 py-2 rounded-xl shadow-sm">
                                <span>🕐</span>
                                <span>{format(new Date(block.start_at), 'HH:mm')} - {format(new Date(block.end_at), 'HH:mm')}</span>
                              </span>
                              <span className="px-4 py-2 text-sm font-black bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white rounded-xl shadow-md hover:scale-110 transition-transform">
                                ⏱️ {calculateDuration(block.start_at, block.end_at)}
                              </span>
                            </div>
                          </div>

                          {/* Delete Button with Enhanced Styling */}
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-4 text-red-600 hover:text-white hover:bg-red-500 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl hover:scale-125"
                          >
                            <span className="text-2xl">🗑️</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Block Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Busy Block"
      >
        <BusyBlockForm
          onSubmit={handleCreateBlock}
          isLoading={createBlock.isPending}
        />
      </Modal>
    </Layout>
  );
};

export default BusyBlocks;
