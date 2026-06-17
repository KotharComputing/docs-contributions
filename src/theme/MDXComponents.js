import React from 'react';
// Import the original mapper to preserve all default Docusaurus components
import MDXComponents from '@theme-original/MDXComponents';
import { Highlight } from '@site/src/components/Highlight/Highlight';
import Authors from '@site/src/components/Authors/Authors';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@site/src/components/Accordion/Accordion.jsx';
import Figure from '@site/src/components/Figure/Figure.jsx';
import KotharSpark from '@site/src/components/KotharSpark/KotharSpark.jsx';

const StateHighlight = ({ children }) => (
  <Highlight type='state'>{children}</Highlight>
);
const OperatorHighlight = ({ children }) => (
  <Highlight type='operator'>{children}</Highlight>
);
const HelperHighlight = ({ children }) => (
  <Highlight type='helper'>{children}</Highlight>
);
const AlgorithmHighlight = ({ children }) => (
  <Highlight type='algorithm'>{children}</Highlight>
);

export default {
  ...MDXComponents,
  Highlight,
  State: StateHighlight,
  Operator: OperatorHighlight,
  Helper: HelperHighlight,
  Algorithm: AlgorithmHighlight,
  Authors,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Figure,
  KotharSpark,
};
