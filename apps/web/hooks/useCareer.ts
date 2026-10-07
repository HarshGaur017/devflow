import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getCareerReport,
  getCareerScan,
  startCareerScan,
  type StartScanOptions,
} from "@/services/career.service";

export function useCareerReport() {
  return useQuery({
    queryKey: ["career", "report"],
    queryFn: getCareerReport,
    retry: false,
  });
}

/**
 * Polls a running scan every two seconds and refreshes the report once it
 * finishes. `scanId` is null when nothing is in flight.
 */
export function useCareerScanProgress(scanId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["career", "scan", scanId],
    queryFn: () => getCareerScan(scanId!),
    enabled: Boolean(scanId),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "RUNNING" || status === "PENDING" ? 2000 : false;
    },
  });

  const status = query.data?.status;

  useEffect(() => {
    if (status === "COMPLETED") {
      void queryClient.invalidateQueries({ queryKey: ["career", "report"] });
    }
  }, [status, queryClient]);

  return query;
}

export function useStartCareerScan() {
  const queryClient = useQueryClient();
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (options: StartScanOptions) => startCareerScan(options),
    onSuccess: (scan) => {
      setActiveScanId(scan.id);
      void queryClient.invalidateQueries({ queryKey: ["career", "scan"] });
    },
    onError: (error: unknown) => {
      const response = (
        error as { response?: { status?: number; data?: { scanId?: string; error?: string } } }
      ).response;

      // A scan is already running — adopt it rather than reporting a failure.
      if (response?.status === 409 && response.data?.scanId) {
        setActiveScanId(response.data.scanId);
        toast("A scan was already running — showing its progress.");
        return;
      }

      toast.error(response?.data?.error ?? "Could not start the scan.");
    },
  });

  return {
    startScan: mutation.mutate,
    isStarting: mutation.isPending,
    activeScanId,
    setActiveScanId,
  };
}
