import React from 'react'
import {User} from '../../Models/DatabaseObjects/User';
import {Line, LineConfig} from '@ant-design/plots';
import {toString} from 'common/build-models/Mood';
import {DeveloperMood} from 'common/build-models/Project';

export function MoodGraph({ moodData, developers, projectManagerID }: { moodData: DeveloperMood, developers: User[], projectManagerID: string }) {
  const mean = Array(5).fill(0);
  const data = Object.entries(moodData).map(([devID, moodHistory]) => {
    if (devID === projectManagerID) {
      return [];
    }
    return moodHistory.map((val, i) => {
      mean[i] += val;
      return {
        mood: val,
        weeksAgo: i,
        developer: developers.find(dev => dev._id === devID).getInitials()
    }
  })
  }).flat();
  data.push(...mean.map((val, i) => ({
    mood: val / Object.keys(moodData).length,
    weeksAgo: i,
    developer: 'Mean'
  })));



  const config: LineConfig = {
    data,
    xField: 'weeksAgo',
    yField: 'mood',
    seriesField: 'developer',
    yAxis: {
      min: -2,
      max: 2
    },
    meta: { 
      mood: {
        formatter(value: number) {
          return toString(value).name;
        },
      },
      weeksAgo: {
        formatter(value) {
          if (value === 4) {
            return '1 week ago'
          }
          return `${5 - value} weeks ago`;
        },
      }
    },
    label: {
      rotate: -50
    },
    smooth: true,

  }
  return (
    <Line {...config} />
  )
}
