import { useQuery } from "react-query";
import axios, { AxiosResponse } from "axios";

import { getMetaValue } from "src/utils";
import { useAutoRefresh } from "src/context/autorefresh";
import useErrorToast from "src/utils/useErrorToast";
import useFilters, {
  BASE_DATE_PARAM,
  NUM_RUNS_PARAM,
  RUN_STATE_PARAM,
  RUN_TYPE_PARAM,
  now,
  FILTER_DOWNSTREAM_PARAM,
  FILTER_UPSTREAM_PARAM,
  ROOT_PARAM,
} from "src/dag/useFilters";
import type { Task, DagRun, RunOrdering } from "src/types";
import { camelCase } from "lodash";

const DAG_ID_PARAM = "dag_id";

// dagId comes from dag.html
const dagId = getMetaValue(DAG_ID_PARAM);
const taskDurationDataUrl = getMetaValue("duration_data_url");

export interface TaskDurationData {
  task_instances: TaskInstance[];
}

export const emptyTaskDurationData: TaskDurationData = {
  task_instances: [],
};

const formatOrdering = (data: TaskDurationData) => ({
  ...data,
  ordering: data.ordering.map((o: string) => camelCase(o)) as RunOrdering,
});

export const areActiveRuns = (task_instances: TaskInstance[] = []) =>
  task_instances.filter((ti) => ["queued", "running"].includes(ti.state)).length > 0;

const useTaskDurationData = () => {
  const { isRefreshOn, stopRefresh } = useAutoRefresh();
  const errorToast = useErrorToast();
  const {
    filters: {
      baseDate,
      numRuns,
      runType,
      runState,
      root,
      filterDownstream,
      filterUpstream,
    },
  } = useFilters();

  const query = useQuery(
    [
      "taskDurationData",
      baseDate,
      numRuns,
      runType,
      runState,
      root,
      filterUpstream,
      filterDownstream,
    ],
    async () => {
      const params = {
        [ROOT_PARAM]: root,
        [FILTER_UPSTREAM_PARAM]: filterUpstream,
        [FILTER_DOWNSTREAM_PARAM]: filterDownstream,
        [DAG_ID_PARAM]: dagId,
        [BASE_DATE_PARAM]: baseDate === now ? undefined : baseDate,
        [NUM_RUNS_PARAM]: numRuns,
        [RUN_TYPE_PARAM]: runType,
        [RUN_STATE_PARAM]: runState,
      };
      const response = await axios.get<AxiosResponse, TaskDurationData>(taskDurationDataUrl, {
        params,
      });
      // turn off auto refresh if there are no active runs
      if (!areActiveRuns(response.task_instances)) stopRefresh();
      return response;
    },
    {
      // only refetch if the refresh switch is on
      refetchInterval: isRefreshOn && (autoRefreshInterval || 1) * 1000,
      keepPreviousData: true,
      onError: (error: Error) => {
        stopRefresh();
        errorToast({
          title: "Auto-refresh Error",
          error,
        });
        throw error;
      },
    }
  );
  return {
    ...query,
    data: query.data ?? [],
  };
};

export default useTaskDurationData;
