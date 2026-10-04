'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { rateApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { History, GitBranch, Clock, User, Loader2, ArrowUpRight, ChevronRight, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface VersionHistoryProps {
  analysisId: string;
  analysisNo: string;
  onRestore?: (version: any) => void;
}

interface Version {
  analysisId: string;
  analysisNo: string;
  versionNo: number;
  status: string;
  createdAt: Date;
  createdBy: string;
  totalPurchaseValue: number;
  totalSellingValue: number;
  totalMargin: number;
  remarks: string;
  isRequote: boolean;
  isCurrent: boolean;
  requoteReason: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  calculated: 'bg-blue-100 text-blue-700',
  submitted: 'bg-indigo-100 text-indigo-700',
  approval_pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  locked: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-700',
};

export function VersionHistory({ analysisId, analysisNo, onRestore }: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [createRequote, setCreateRequote] = useState(false);
  const [requoteReason, setRequoteReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { data: versionData, isLoading, refetch } = useQuery({
    queryKey: ['rate-versions', analysisId],
    queryFn: async () => {
      const response = await rateApi.getVersionHistory(analysisId);
      return response.data;
    },
  });

  const versionsList: Version[] = versionData?.versions || [];
  const totalVersions = versionData?.totalVersions || 0;

  const handleViewDetails = (version: Version) => {
    setSelectedVersion(version);
    setShowDetails(true);
  };

  const handleNavigateToVersion = (version: Version) => {
    if (version.analysisId !== analysisId) {
      router.push(`/dashboard/rate/${version.analysisId}`);
    }
  };

  const handleRestore = (version: Version) => {
    if (onRestore) onRestore(version);
    toast.success(`Restored to version ${version.versionNo}`);
    setShowDetails(false);
  };

  const handleCreateRequote = async () => {
    if (!requoteReason.trim()) {
      toast.error('Please provide a reason for requote');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await rateApi.createRequote(analysisId, { reason: requoteReason });
      const newAnalysis = response.data;
      toast.success('Requote created successfully');
      setCreateRequote(false);
      setRequoteReason('');

      const newId = newAnalysis?.analysisId || newAnalysis?.id;
      if (newId) {
        router.push(`/dashboard/rate/${newId}`);
      } else {
        refetch();
      }
    } catch (error: any) {
      console.error('Failed to create requote:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create requote');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate margin change between consecutive versions
  const getMarginChange = (version: Version, index: number) => {
    if (index === 0) return null;
    const prev = versionsList[index - 1];
    if (!prev) return null;
    const diff = Number(version.totalMargin || 0) - Number(prev.totalMargin || 0);
    return diff;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Version History</h3>
          <Badge variant="outline">{totalVersions} {totalVersions === 1 ? 'version' : 'versions'}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCreateRequote(true)}>
          <GitBranch className="h-4 w-4 mr-2" />
          Create Requote
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : versionsList.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          {versionsList.length > 1 && (
            <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-gray-200 z-0" />
          )}

          <div className="space-y-3 relative z-10">
            {versionsList.map((version: Version, index: number) => {
              const marginChange = getMarginChange(version, index);
              const isCurrentPA = version.analysisId === analysisId;
              const isLatest = index === versionsList.length - 1;

              return (
                <div key={version.analysisId} className="flex gap-3">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-4 shrink-0">
                    <div className={`w-[12px] h-[12px] rounded-full border-2 ${
                      isCurrentPA
                        ? 'bg-blue-500 border-blue-500'
                        : version.status === 'locked'
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300'
                    }`} />
                  </div>

                  <Card
                    className={`flex-1 cursor-pointer transition-all hover:shadow-md ${
                      isCurrentPA
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleViewDetails(version)}
                  >
                    <CardContent className="pt-3 pb-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <Badge className={`text-xs ${isCurrentPA ? 'bg-blue-500' : isLatest ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                              V{version.versionNo}
                            </Badge>
                            {version.isRequote && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
                                Requote
                              </Badge>
                            )}
                            {isCurrentPA && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{version.analysisNo}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(version.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Purchase</p>
                            <p className="font-mono text-sm font-medium">₹{Number(version.totalPurchaseValue || 0).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Selling</p>
                            <p className="font-mono text-sm font-medium">₹{Number(version.totalSellingValue || 0).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="text-right min-w-[70px]">
                            <p className="text-xs text-gray-500">Margin</p>
                            <div className="flex items-center gap-1 justify-end">
                              <p className={`font-mono text-sm font-medium ${(version.totalMargin || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Number(version.totalMargin || 0).toFixed(2)}%
                              </p>
                              {marginChange !== null && marginChange !== 0 && (
                                <span className={`text-[10px] flex items-center ${marginChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {marginChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge className={`text-xs ${statusColors[version.status] || 'bg-gray-100 text-gray-700'}`}>
                            {version.status?.replace(/_/g, ' ')}
                          </Badge>
                          {!isCurrentPA && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleNavigateToVersion(version); }}
                              className="text-blue-500 hover:text-blue-700"
                              title="Open this version"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          )}
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      {version.requoteReason && (
                        <div className="mt-2 p-2 bg-orange-50 rounded text-xs">
                          <p className="text-orange-700"><strong>Reason:</strong> {version.requoteReason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">No version history available</div>
      )}

      {/* Version Details Dialog */}
      <Dialog open={showDetails} onOpenChange={(open) => !open && setShowDetails(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Version {selectedVersion?.versionNo} — {selectedVersion?.analysisNo}
              {selectedVersion?.isCurrent && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">Current</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedVersion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Purchase Value</p>
                  <p className="text-2xl font-bold font-mono">₹{Number(selectedVersion.totalPurchaseValue || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Selling Value</p>
                  <p className="text-2xl font-bold font-mono">₹{Number(selectedVersion.totalSellingValue || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Margin</p>
                  <p className={`text-2xl font-bold font-mono ${(selectedVersion.totalMargin || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(selectedVersion.totalMargin || 0).toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={`mt-1 ${statusColors[selectedVersion.status] || 'bg-gray-100 text-gray-700'}`}>
                    {selectedVersion.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p><strong>Created:</strong> {new Date(selectedVersion.createdAt).toLocaleString('en-IN')}</p>
                {selectedVersion.remarks && <p><strong>Remarks:</strong> {selectedVersion.remarks}</p>}
              </div>
              {selectedVersion.requoteReason && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="font-medium text-orange-800">Requote Reason</p>
                  <p className="text-orange-700">{selectedVersion.requoteReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>Close</Button>
            {selectedVersion && !selectedVersion.isCurrent && (
              <Button variant="outline" onClick={() => handleNavigateToVersion(selectedVersion)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open This Version
              </Button>
            )}
            {selectedVersion && selectedVersion.status !== 'locked' && !selectedVersion.isCurrent && (
              <Button onClick={() => handleRestore(selectedVersion)}>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Restore This Version
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Requote Dialog */}
      <Dialog open={createRequote} onOpenChange={(open) => !open && setCreateRequote(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Requote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for Requote *</Label>
              <Textarea value={requoteReason} onChange={(e) => setRequoteReason(e.target.value)} placeholder="Explain why a requote is needed..." rows={4} />
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will create Version {totalVersions + 1} by copying all items from the current version. The original version is preserved. You can then edit specific values in the new version.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRequote(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleCreateRequote} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <GitBranch className="h-4 w-4 mr-2" />
                  Create Requote (V{totalVersions + 1})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VersionHistory;
