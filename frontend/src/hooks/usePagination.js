// src/hooks/usePagination.js
import { useState } from 'react';

export const usePagination = (initialPageSize = 30) => {
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: initialPageSize
  });

  const totalPages = Math.ceil(pagination.count / pagination.pageSize);

  const goToPage = (page) => {
    setPagination(prev => ({
      ...prev,
      page: Math.max(1, Math.min(totalPages, page))
    }));
  };

  const changePageSize = (pageSize) => {
    setPagination(prev => ({
      ...prev,
      pageSize: parseInt(pageSize),
      page: 1 // Reset to first page when changing page size
    }));
  };

  const nextPage = () => {
    if (pagination.page < totalPages) {
      goToPage(pagination.page + 1);
    }
  };

  const previousPage = () => {
    if (pagination.page > 1) {
      goToPage(pagination.page - 1);
    }
  };

  return {
    pagination,
    setPagination,
    totalPages,
    goToPage,
    changePageSize,
    nextPage,
    previousPage
  };
};