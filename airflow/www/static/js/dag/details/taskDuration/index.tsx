/*!
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useRef } from "react";
import { Box } from "@chakra-ui/react";
import { useOffsetTop, getMetaValue } from "src/utils";
import ReactECharts from "src/components/ReactECharts";
import useTaskInstance from "src/api/useTaskInstance";

interface Props {
  taskId: string;
  runId: DagRun["runId"];
}

const TaskDuration = ({ taskId, runId }: Props) => {
  const taskDurationRef = useRef<HTMLDivElement>(null);
  const offsetTop = useOffsetTop(taskDurationRef);

  const dagId = getMetaValue("dag_id");
  const { data: apiTI } = useTaskInstance({
    dagId,
    dagRunId: runId || "~",
  });

  console.log(taskId);
  let taskIds: string[];
  let taskStarts: date[];

  let series: any[];
  if (apiTI.taskInstances && apiTI.taskInstances.length > 0) {
    taskIds = Array.from(
      new Set(apiTI.taskInstances.map((taskInstance) => taskInstance.taskId))
    );
    taskStarts = Array.from(
      new Set(
        apiTI.taskInstances.map((taskInstance) => taskInstance.executionDate)
      )
    );
    // duration = apiTI.taskInstances.map((taskInstance) => taskInstance.duration);

    series = taskIds.map((taskIdTemp) => ({
      name: taskIdTemp,
      type: "line",
      data: taskStarts.map((taskStart) => {
        const taskInstance = apiTI.taskInstances.find(
          (instance) =>
            instance.taskId === taskIdTemp &&
            new Date(instance.executionDate).getTime() ===
              new Date(taskStart).getTime()
        );
        return taskInstance ? taskInstance.duration : null;
      }),
    }));
    console.log(taskIds);
    console.log(taskStarts);
  }
  const option = {
    legend: {
      data: taskIds,
    },
    xAxis: {
      type: "category",
      data: taskStarts,
    },
    yAxis: {
      type: "value",
    },
    series,
  };

  console.log(option);

  return (
    <Box
      ref={taskDurationRef}
      height={`calc(100% - ${offsetTop}px)`}
      overflow="scroll"
    >
      {apiTI.taskInstances && apiTI.taskInstances.length > 0 && (
        <ReactECharts option={option} />
      )}
    </Box>
  );
};

export default TaskDuration;
