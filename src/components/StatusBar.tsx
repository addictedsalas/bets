interface StatusBarProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  opportunityCount: number;
}

export default function StatusBar({ connectionStatus, opportunityCount }: StatusBarProps) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>{getStatusIcon()}</span>
            <span className={`font-semibold ${getStatusColor()}`}>
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </span>
          </div>
          
          <div className="text-gray-400">•</div>
          
          <div className="text-white">
            <span className="font-semibold">{opportunityCount}</span>
            <span className="text-gray-400 ml-1">
              active opportunity{opportunityCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Monitoring live games</span>
          </div>
          
          <div className="text-gray-500">
            Updated every 30s
          </div>
        </div>
      </div>
    </div>
  );
}