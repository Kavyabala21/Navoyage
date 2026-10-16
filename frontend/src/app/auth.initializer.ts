import { DataFacade } from '../Shared/Services/data-fascade';

export function authInitializerFactory(dataFacade: DataFacade) {
  return () => dataFacade.restoreAuth();
}
