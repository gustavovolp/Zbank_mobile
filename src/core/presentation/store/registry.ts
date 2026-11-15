import type { Dispatch, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

export interface StateRegistry {}

export interface DependenciesRegistry {}

export type RootState = StateRegistry;

export type AppDependencies = DependenciesRegistry;

export type AppDispatch = ThunkDispatch<RootState, AppDependencies, UnknownAction> & Dispatch<UnknownAction>;
