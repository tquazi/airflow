import React, { useRef, useState, useEffect } from "react";
import { Box } from "@chakra-ui/react";
import { useOffsetTop, getMetaValue } from "src/utils";
import ReactECharts from "src/components/ReactECharts";
import useTaskDurationData from "src/api/useTaskDurationData";
import infer_time_unit, scale_time_units from "src/utils/date"

interface Props {
  taskId: string;
  runId: DagRun["runId"];
}

const TaskDuration = ({ taskId, runId }: Props) => {
  const taskDurationRef = useRef<HTMLDivElement>(null);
  const offsetTop = useOffsetTop(taskDurationRef);

  const dagId = getMetaValue("dag_id");
  const { data: apiTI } = useTaskDurationData();

  const [option, setOption] = useState<any>({});

  useEffect(() => {
    if (apiTI.taskInstances && apiTI.taskInstances.length > 0) {

    console.log(apiTI.taskInstances)

      let taskIds = Array.from(
          new Set(
            apiTI.taskInstances.map((taskInstance) => {
              const taskId = taskInstance.mapIndex === -1 ? taskInstance.taskId : `${taskInstance.taskId} [ ]`;
              return taskId;
            })
          )
        );
      if (taskId) {
        taskIds = taskIds.filter((id) => id.startsWith(taskId));
      }
      let taskStarts = Array.from(
        new Set(
          apiTI.taskInstances.map((taskInstance) => taskInstance.executionDate)
        )
      );

      const updatedSeries = taskIds.map((taskIdTemp) => {
        const seriesData = [];

      taskStarts.forEach((taskStart) => {
      console.log(taskStart);
        const taskInstances = apiTI.taskInstances.filter(
          (instance) =>
            instance.taskId === taskIdTemp.replace(" [ ]","") &&
            new Date(instance.executionDate).getTime() ===
              new Date(taskStart).getTime()
        );
        const runDurationSum = taskInstances.reduce(
      (sum, instance) => sum + (instance.runDuration || 0),
      0
    );


          seriesData.push([taskStart, runDurationSum]);

      });

      return {
        name: taskIdTemp,
        type: "line",
        data: seriesData,
      };
    });
console.log(infer_time_unit(updatedSeries.series))
      const updatedOption = {
        legend: {
          data: taskIds,
        },
        tooltip: {
        trigger: 'item', // Show tooltip when hovering over data points
        valueFormatter: (value) =>  value.toFixed(1)+" s"
      },

        xAxis: {
          type: "category",
          data: taskStarts,
          boundaryGap: true,
          axisTick: {
            alignWithLabel: true,
          },
          axisLabel: {
              formatter: function (value) {
                const date = new Date(value);
                const hours = date.getHours().toString().padStart(2, "0");
                const minutes = date.getMinutes().toString().padStart(2, "0");
                const day = date.getDate();
                const month = date.toLocaleString("default", { month: "short" });
                return `${hours}:${minutes}\n${day}-${month}`;

              },
            },
          },
        yAxis: {
          type: "value",
          axisLabel: {
              formatter: "{value} s",
            },
         name: 'Duration (seconds)',
        nameLocation: 'middle',
        nameGap: 70
        },
        series: updatedSeries,
      };
        console.log(updatedOption)
      setOption(updatedOption);
    }
  }, [apiTI, taskId]);

  return (
    <Box
      ref={taskDurationRef}
      height={`calc(100% - ${offsetTop}px)`}
      overflow="scroll"
    >
      {apiTI.taskInstances && apiTI.taskInstances.length > 0 && (
        <ReactECharts option={option} settings={true}/>
      )}
    </Box>
  );
};

export default TaskDuration;
