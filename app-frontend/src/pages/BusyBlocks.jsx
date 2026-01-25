import { useState } from 'react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import BusyBlockForm from '../components/blocks/BusyBlockForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useBusyBlocks, useCreateBusyBlock, useDeleteBusyBlock } from '../hooks/useBusyBlocks';
import { format, differenceInMinutes } from 'date-fns';
import showToast from '../utils/toast';

const BusyBlocks = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: blocks, isLoading } = useBusyBlocks();
  const createBlock = useCreateBusyBlock();
  const deleteBlock = useDeleteBusyBlock();

  const handleCreateBlock = async (data) => {
    try {
      await createBlock.mutateAsync(data);
      showToast.success('Busy block created successfully!');
      setIsModalOpen(false);
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to create busy block');
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (window.confirm('Are you sure you want to delete this busy block?')) {
      try {
        await deleteBlock.mutateAsync(blockId);
        showToast.success('Busy block deleted successfully!');
      } catch (error) {
        showToast.error(error.response?.data?.message || 'Failed to delete busy block');
      }
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
        <LoadingSpinner size="lg" className="mt-20" />
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Busy Blocks</h1>
            <p className="mt-2 text-gray-600">Mark times when you're unavailable</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            ➕ Add Busy Block
          </button>
        </div>

        {/* Blocks List */}
        {sortedDates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No busy blocks yet</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Add Your First Busy Block
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date} className="space-y-4">
                {/* Date Header */}
                <h2 className="text-lg font-bold text-gray-900">
                  {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
                </h2>

                {/* Blocks for this date */}
                <div className="grid grid-cols-1 gap-4">
                  {groupedBlocks[date]
                    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
                    .map((block) => (
                      <div
                        key={block.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {block.title}
                            </h3>
                            <div className="flex items-center space-x-4 mt-3">
                              <span className="text-sm text-gray-600">
                                🕐 {format(new Date(block.start_at), 'HH:mm')} - {format(new Date(block.end_at), 'HH:mm')}
                              </span>
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                {calculateDuration(block.start_at, block.end_at)}
                              </span>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            🗑️
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
