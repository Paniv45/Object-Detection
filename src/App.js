// src/App.js

import React from 'react';
import './App.css';
import ObjectDetection from './components/ObjectDetection';

function App() {
  return (
    <div className="App">
      <h1>Object Detection using TensorFlow.js</h1>
      <ObjectDetection />
    </div>
  );
}

export default App;
