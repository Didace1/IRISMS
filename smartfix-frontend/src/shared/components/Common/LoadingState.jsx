import React from 'react';
import { ThreeDotsLoader } from './ThreeDotsLoader';

export const LoadingState = ({ message = 'Loading...' }) => (
  <div className="flex justify-center items-center h-40">
    <ThreeDotsLoader message={message} size="normal" animation="bounce" />
  </div>
);
