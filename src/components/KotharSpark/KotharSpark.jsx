import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { usePluginData } from '@docusaurus/useGlobalData';
import './KotharSpark.css';

const KOTHAR_SPARK_API_BASE = 'https://api.kotharcomputing.com/v1/sparks';
const KOTHAR_SPARK_URL_BASE = 'https://sparks.kotharcomputing.com/s';

export default function KotharSpark({ id }) {
  if (!id) {
    throw new Error('KotharSpark requires an `id` prop.');
  }

  const pluginData = usePluginData('kothar-sparks');
  const buildSpark = pluginData?.sparksById?.[id];
  const [clientSpark, setClientSpark] = useState(null);
  const [clientError, setClientError] = useState(false);
  const spark = buildSpark ?? clientSpark;
  const href = spark?.url ?? `${KOTHAR_SPARK_URL_BASE}/${encodeURIComponent(id)}`;

  useEffect(() => {
    if (buildSpark || typeof window === 'undefined') {
      return undefined;
    }

    let cancelled = false;

    fetch(`${KOTHAR_SPARK_API_BASE}/${encodeURIComponent(id)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setClientSpark(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClientError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [buildSpark, id]);

  const description = useMemo(() => {
    if (!spark?.description) {
      return clientError
        ? 'Spark details are unavailable right now.'
        : 'Loading Spark details...';
    }

    return spark.description
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1');
  }, [clientError, spark]);

  return (
    <a className='kothar-spark' href={href} target='_blank'>
      <div className='kothar-spark-header'>
        <div className='kothar-spark-title-group'>
          <span className='kothar-spark-kicker'>Kothar Spark</span>
          <span className='kothar-spark-title'>{id}</span>
        </div>
        <ExternalLink
          className='kothar-spark-external-icon'
          size={17}
          strokeWidth={1.8}
          aria-hidden='true'
        />
      </div>

      <p className='kothar-spark-description'>{description}</p>

      <div className='kothar-spark-meta'>
        <span>{spark?.ownerDisplayName ?? 'Kothar'}</span>
        {spark?.createdAt ? (
          <span>
            {new Intl.DateTimeFormat('en', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              timeZone: 'UTC',
            }).format(new Date(spark.createdAt))}
          </span>
        ) : null}
        {typeof spark?.fileCount === 'number' ? (
          <span>
            {spark.fileCount} {spark.fileCount === 1 ? 'file' : 'files'}
          </span>
        ) : null}
        {typeof spark?.totalBytes === 'number' ? (
          <span>
            {spark.totalBytes >= 1024 * 1024
              ? `${(spark.totalBytes / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.max(1, Math.round(spark.totalBytes / 1024))} KB`}
          </span>
        ) : null}
      </div>

      {spark?.files?.length ? (
        <div className='kothar-spark-files'>
          {spark.files.slice(0, 10).map((file) => (
            <span className='kothar-spark-file' key={file.path}>
              <FileText size={14} strokeWidth={1.8} aria-hidden='true' />
              <span>{file.path}</span>
            </span>
          ))}
          {spark.files.length > 10 ? (
            <span className='kothar-spark-file kothar-spark-file-overflow'>
              +{spark.files.length - 10} more
            </span>
          ) : null}
        </div>
      ) : null}

      <span className='kothar-spark-action'>
        Open to preview files and import them into your workspace.
      </span>
    </a>
  );
}
