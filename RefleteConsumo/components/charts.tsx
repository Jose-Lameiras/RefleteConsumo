import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  LineChart,
  PieChart,
  BarChart,
} from 'react-native-chart-kit';

interface ChartProps {
  type: 'pie' | 'line' | 'bar';
  data: any;
  width?: number;
  height?: number;
  title?: string;
}

export function GastosChart({
  type,
  data,
  width = Dimensions.get('window').width - 32,
  height = 250,
}: ChartProps) {
  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(46, 196, 182, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#2ec4b6',
    },
    decimalPlaces: 2,
  };

  if (type === 'pie') {
    return (
      <View style={styles.chartContainer}>
        <PieChart
          data={data}
          width={width}
          height={height}
          chartConfig={chartConfig}
          accessor={'population'}
          backgroundColor={'transparent'}
          paddingLeft={'15'}
          hasLegend={true}
          style={{
            marginVertical: 8,
            borderRadius: 12,
          }}
        />
      </View>
    );
  }

  if (type === 'line') {
    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={data}
          width={width}
          height={height}
          chartConfig={chartConfig}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 12,
          }}
        />
      </View>
    );
  }

  if (type === 'bar') {
    return (
      <View style={styles.chartContainer}>
        <BarChart
          data={data}
          width={width}
          height={height}
          chartConfig={chartConfig}
          style={{
            marginVertical: 8,
            borderRadius: 12,
          }}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
});
