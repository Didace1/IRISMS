// src/features/auth/services/authApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080'
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials
      })
    }),
    
    register: builder.mutation({
      query: (userData) => ({
        url: '/api/auth/register',
        method: 'POST',
        body: userData
      })
    }),
    
    verifyMfa: builder.mutation({
      queryFn: async ({ code }) => {
        if (code === '123456') return { data: { verified: true } };
        return { error: { status: 401, data: { message: 'Invalid MFA code' } } };
      }
    }),

    verifyOtp: builder.mutation({
      query: (body) => ({
        url: '/api/auth/verify-otp',
        method: 'POST',
        body,
      })
    }),

    getPendingUsers: builder.query({
      query: () => '/api/auth/pending',
      providesTags: ['PendingUsers'],
    }),

    approveUser: builder.mutation({
      query: (id) => ({
        url: `/api/auth/approve/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: ['PendingUsers'],
    }),

    rejectUser: builder.mutation({
      query: (id) => ({
        url: `/api/auth/reject/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PendingUsers'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyMfaMutation,
  useVerifyOtpMutation,
  useGetPendingUsersQuery,
  useApproveUserMutation,
  useRejectUserMutation,
} = authApi;