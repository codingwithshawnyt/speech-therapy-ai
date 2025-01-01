import React, { useRef, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { analyzeSpeech } from '../../utils/speechAnalysis';
import * as d3 from 'd3'; // Assuming you're using D3 for visualization

const AnalysisContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: 800,
  margin: '0 auto',
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const RealTimeAnalysis = () => {
  const { listen, listening, transcript, resetTranscript } = useSpeechRecognition();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState([]);
  const [chart, setChart] = useState(null);
  const [showVisualization, setShowVisualization] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    if (transcript) {
      handleAnalyze();
    }
  }, [transcript]);

  useEffect(() => {
    // Initialize the chart when the component mounts
    if (showVisualization && chartRef.current && !chart) {
      const newChart = createChart(chartRef.current);
      setChart(newChart);
    }

    // Clean up the chart when the component unmounts or visualization is toggled off
    return () => {
      if (chart) {
        chart.destroy();
        setChart(null);
      }
    };
  }, [showVisualization]);

  useEffect(() => {
    // Update the chart with new analysis data
    if (chart && analysisData.length > 0) {
      chart.update(analysisData);
    }
  }, [chart, analysisData]);

  const handleListen = () => {
    resetTranscript();
    listen();
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const results = await analyzeSpeech(transcript);

      // Transform analysis results into data suitable for the chart
      const newData = transformAnalysisData(results);

      // Update the analysis data state
      setAnalysisData((prevData) => [...prevData, newData]);
    } catch (error) {
      console.error('Speech analysis error:', error);
      // Handle error, e.g., show an error message
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to transform analysis results into chart-compatible data
  const transformAnalysisData = (results) => {
    const { fluencyScore, speakingRate, pauseDuration, articulationRate } = results;
    const timestamp = new Date().toLocaleTimeString(); // Get current time

    return {
      timestamp,
      fluencyScore,
      speakingRate,
      pauseDuration,
      articulationRate,
    };
  };

  // Function to create the D3 chart
  const createChart = (container) => {
    // Set up chart dimensions and margins
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = container.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG element
    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales for x and y axes
    const xScale = d3
      .scaleTime()
      .range([0, width]);
    const yScale = d3
      .scaleLinear()
      .domain([0, 1]) // Assuming fluency score is between 0 and 1
      .range([height, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Add axes to the chart
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);
    svg.append('g').call(yAxis);

    // Add labels to the axes
    svg
      .append('text')
      .attr('transform', `translate(${width / 2},${height + margin.bottom - 5})`)
      .style('text-anchor', 'middle')
      .text('Time');
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Fluency Score');

    // Function to update the chart with new data
    const updateChart = (data) => {
      // Update the x scale domain
      xScale.domain(d3.extent(data, (d) => new Date(d.timestamp)));

      // Create the line generator
      const line = d3
        .line()
        .x((d) => xScale(new Date(d.timestamp)))
        .y((d) => yScale(d.fluencyScore));

      // Join the data with the line path
      const path = svg.selectAll('.line').data([data]);

      // Enter selection: add a new line if it doesn't exist
      path
        .enter()
        .append('path')
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('d', line);

      // Update selection: update the existing line with new data
      path.transition().duration(1000).attr('d', line);

      // Exit selection: remove any lines that are no longer needed
      path.exit().remove();

      // Update the x axis
      svg.select('.x-axis').transition().duration(1000).call(xAxis);
    };

    // Return an object with the update function and a destroy function
    return {
      update: updateChart,
      destroy: () => {
        svg.remove();
      },
    };
  };

  const handleVisualizationToggle = (event) => {
    setShowVisualization(event.target.checked);
  };

  return (
    <AnalysisContainer>
      <Typography variant="h4" gutterBottom>
        Real-time Analysis
      </Typography>

      <Button variant="contained" onClick={handleListen} disabled={listening || isAnalyzing}>
        {listening || isAnalyzing ? <CircularProgress size={24} /> : 'Start Speaking'}
      </Button>

      <FormControlLabel
        control={<Switch checked={showVisualization} onChange={handleVisualizationToggle} />}
        label="Show Visualization"
        sx={{ mt: 2 }}
      />

      {showVisualization && (
        <ChartContainer ref={chartRef}>
          {!chart && <LinearProgress />}
        </ChartContainer>
      )}
    </AnalysisContainer>
  );
};

export default RealTimeAnalysis;