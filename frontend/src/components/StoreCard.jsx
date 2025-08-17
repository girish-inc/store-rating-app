import { useState, memo } from 'react';

// Store card component - this one was tricky to get the rating stars right
const StoreCard = memo(({ store, userRating, onRatingSubmit, onRatingDelete }) => {
  const [selectedRating, setSelectedRating] = useState(userRating || 0); // default to user's existing rating
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false); // controls rating form visibility

  const handleRatingClick = (rating) => {
    setSelectedRating(rating);
  };

  const handleSubmitRating = async () => {
    if (selectedRating === 0) return; // don't submit empty ratings
    
    setIsSubmitting(true);
    try {
      await onRatingSubmit(store.id, selectedRating); // make sure it's a number
      setShowRatingForm(false);
      // console.log('Rating submitted successfully!'); // debug trace
    } catch (error) {
      console.error('Failed to submit rating:', error); // keeping this error log
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    setIsSubmitting(true);
    try {
      await onRatingDelete(store.id);
      setSelectedRating(0);
      setShowRatingForm(false);
    } catch (error) {
      console.error('Failed to delete rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Star rendering function - took me a while to get this working properly!
  const renderStars = (rating, interactive = false, size = 'w-5 h-5') => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={interactive ? () => handleRatingClick(star) : undefined}
            disabled={!interactive}
            className={`${size} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <svg
              className={`w-full h-full ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 fill-current'
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-theme-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 border border-theme-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-theme-gray-800 mb-2 hover:text-theme-blue-600 transition-colors">{store.name}</h3>
          <p className="text-theme-gray-600 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-1 text-theme-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {store.address}
          </p>
          <p className="text-theme-gray-600 text-sm mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-theme-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {store.email}
          </p>
        </div>
      </div>
        
        {/* Enhanced Overall Rating */}
        <div className="mb-6">
          <div className="bg-theme-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-theme-gray-700">Overall Rating</span>
              <span className="text-sm text-theme-gray-500 bg-theme-white px-2 py-1 rounded-full">
                {store.total_ratings || 0} review{(store.total_ratings || 0) !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center mr-3">
                {renderStars(Math.round(store.rating || 0))}
              </div>
              <span className="text-lg font-semibold text-theme-gray-800">
                {store.rating ? store.rating.toFixed(1) : 'No ratings'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Enhanced User Rating Section */}
        <div className="border-t border-theme-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-theme-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-theme-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Your Rating
          </h4>
          
          {userRating && !showRatingForm ? (
            <div className="bg-theme-blue-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {renderStars(userRating)}
                  <span className="text-lg font-bold text-theme-blue-600">{userRating}/5</span>
                </div>
                <span className="text-sm text-theme-blue-600 bg-theme-blue-100 px-2 py-1 rounded-full font-medium">
                  Your Review
                </span>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedRating(userRating);
                    setShowRatingForm(true);
                  }}
                  className="bg-theme-orange text-theme-white px-4 py-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors flex-1 text-sm"
                >
                  Modify Rating
                </button>
                <button
                  onClick={handleDeleteRating}
                  disabled={isSubmitting}
                  className="flex-1 bg-theme-orange text-theme-white py-2 px-4 rounded-md text-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ) : userRating && showRatingForm ? (
            <div className="bg-theme-blue-50 rounded-lg p-4 space-y-4">
              <div className="text-center">
                <span className="text-sm text-theme-gray-600 block mb-2">Modify your rating:</span>
                <div className="mb-2">
                  {renderStars(selectedRating, true, 'w-8 h-8')}
                </div>
                {selectedRating > 0 && (
                  <span className="text-lg font-semibold text-theme-blue-600">{selectedRating}/5</span>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                   onClick={handleSubmitRating}
                   disabled={selectedRating === 0 || isSubmitting}
                   className="flex-1 bg-theme-orange text-theme-white py-2 px-4 rounded-md text-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                 >
                   {isSubmitting ? 'Updating...' : 'Update Rating'}
                 </button>
                <button
                  onClick={() => {
                    setShowRatingForm(false);
                    setSelectedRating(userRating);
                  }}
                  className="flex-1 bg-theme-gray-300 text-theme-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-theme-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-theme-gray-50 rounded-lg p-4">
              <div className="text-center mb-4">
                <span className="text-sm font-medium text-theme-gray-700">Share your experience with this store</span>
              </div>
              
              {!showRatingForm ? (
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="w-full bg-theme-orange text-theme-white py-3 px-4 rounded-md text-sm font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your Rating
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="mb-2">
                      <span className="text-sm text-theme-gray-600 block mb-2">Select your rating:</span>
                      {renderStars(selectedRating, true, 'w-8 h-8')}
                    </div>
                    {selectedRating > 0 && (
                      <span className="text-lg font-semibold text-theme-blue-600">{selectedRating}/5</span>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSubmitRating}
                      disabled={selectedRating === 0 || isSubmitting}
                      className="flex-1 bg-theme-orange text-theme-white py-2 px-4 rounded-md text-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                    <button
                      onClick={() => {
                        setShowRatingForm(false);
                        setSelectedRating(0);
                      }}
                      className="flex-1 bg-theme-gray-300 text-theme-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-theme-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  );
});

export default StoreCard;