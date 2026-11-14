import { EndpointRequirement } from '@/types/security';
import { SPORTS_PERMISSION_PREFIX } from './sports-api';

// Permisos de ms-sports, con el mismo formato {id} que usa la vista de usuarios.
const TOURNAMENTS = `${SPORTS_PERMISSION_PREFIX}/tournaments`;

export const TOURNAMENTS_VIEW_ENDPOINTS: EndpointRequirement[] = [{ url: TOURNAMENTS, method: 'GET' }];

export const TOURNAMENT_DETAIL_ENDPOINTS: EndpointRequirement[] = [{ url: `${TOURNAMENTS}/{id}`, method: 'GET' }];

export const TOURNAMENT_CREATE_ENDPOINT: EndpointRequirement = { url: TOURNAMENTS, method: 'POST' };

// Editar y cambiar estado usan el mismo PATCH
export const TOURNAMENT_UPDATE_ENDPOINT: EndpointRequirement = { url: `${TOURNAMENTS}/{id}`, method: 'PATCH' };

export const TOURNAMENT_DELETE_ENDPOINT: EndpointRequirement = { url: `${TOURNAMENTS}/{id}`, method: 'DELETE' };

export const SPORTS_LIST_ENDPOINT: EndpointRequirement = { url: `${SPORTS_PERMISSION_PREFIX}/sports`, method: 'GET' };
