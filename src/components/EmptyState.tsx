interface EmptyStateProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

export default function EmptyState({ connectionStatus }: EmptyStateProps) {
  const getEmptyStateContent = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          icon: '🔄',
          title: 'Connecting to server...',
          message: 'Please wait while we establish connection.',
          spinning: true
        };
      case 'disconnected':
        return {
          icon: '❌',
          title: 'Connection lost',
          message: 'Unable to connect to the server. Please check your connection.',
          spinning: false
        };
      default:
        return {
          icon: '👀',
          title: 'Scanning for opportunities',
          message: 'No 3rd quarter opportunities found right now. The system is actively monitoring all live basketball games.',
          spinning: false
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
      <div className="text-center">
        <div className={`text-5xl mb-4 ${content.spinning ? 'animate-spin' : ''}`}>
          {content.icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-3">
          {content.title}
        </h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          {content.message}
        </p>
        
        {connectionStatus === 'connected' && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">
              🎯 Opportunity Criteria
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Basketball game in Q3
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                ~7 minutes remaining
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                10+ point edge found
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                FanDuel lines available
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-600">
              <div className="text-xs text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  System checking every 30 seconds
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}