import { useState, useEffect } from 'react';
import { getData } from '../api';

const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getData(url);
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);


  return { data, loading, error, setData };
};

export default useFetch;