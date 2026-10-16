
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'; import { Stop } from './stop';
import { Api_Calls } from '../../Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

describe('Stop Component', () => {

  let component: Stop;
  let fixture: ComponentFixture<Stop>;

  let apiSpy: jasmine.SpyObj<Api_Calls>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {

    apiSpy = jasmine.createSpyObj<Api_Calls>('Api_Calls', [
      'createStop',
      'updateStop',
      'deleteStop',
      'getAllStops'
    ]);

    toastrSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'warning',
      'error'
    ]);

    await TestBed.configureTestingModule({
      imports: [Stop],
      providers: [
        { provide: Api_Calls, useValue: apiSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Stop);
    component = fixture.componentInstance;

    apiSpy.getAllStops.and.returnValue(of({
      status: true,
      data: [
        { stopId: 1, stopName: 'Hyderabad', latitude: 17, longitude: 78 }
      ]
    }));
  });

  /* ---------------- INIT ---------------- */

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  /* ---------------- LOAD STOPS ---------------- */

  it('should load stops', () => {

    component.loadStops();

    expect(component.stops.length).toBe(1);
  });

  /* ---------------- FILTER ---------------- */

  it('should return filtered stops', () => {

    component.stops = [
      { stopName: 'Hyderabad' },
      { stopName: 'Delhi' }
    ] as any;

    component.stopSearch = 'hyd';

    const result = component.filteredStops;

    expect(result.length).toBe(1);
  });

  it('should return all stops if search empty', () => {

    component.stops = [{ stopName: 'Hyderabad' }] as any;

    component.stopSearch = '';

    expect(component.filteredStops.length).toBe(1);
  });

  /* ---------------- MARKER ---------------- */

  it('should set marker and coordinates', () => {

    component.map = {
      setView: jasmine.createSpy()
    };

    component.marker = {
      setLatLng: jasmine.createSpy()
    };

    (component as any).setMarker(10, 20);

    expect(component.latitude).toBe(10);
    expect(component.longitude).toBe(20);
  });

  /* ---------------- LOCATION SEARCH ---------------- */

  it('should clear suggestions if query too short', () => {

    component.locationQuery = 'ab';

    component.searchLocation();

    expect(component.suggestions.length).toBe(0);
  });

  it('should fetch locations', async () => {

    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve([{ display_name: 'Test' }])
      } as any)
    );

    await (component as any).fetchLocations('test');

    expect(window.fetch).toHaveBeenCalled();
  });

  /* ---------------- SELECT SUGGESTION ---------------- */

  it('should select suggestion', () => {

    spyOn<any>(component, 'setMarker');

    const place = {
      lat: '17',
      lon: '78',
      display_name: 'Hyderabad, India'
    };

    component.selectSuggestion(place);

    expect(component.stopName).toBe('Hyderabad');
    expect(component.suggestions.length).toBe(0);
  });

  /* ---------------- SAVE STOP ---------------- */

  it('should warn if form incomplete', () => {

    component.stopName = '';

    component.saveStop();

    expect(toastrSpy.warning).toHaveBeenCalled();
  });

  it('should create stop', () => {

    component.stopName = 'Test';
    component.latitude = 10;
    component.longitude = 20;

    apiSpy.createStop.and.returnValue(of({ status: true }));

    component.saveStop();

    expect(apiSpy.createStop).toHaveBeenCalled();
    expect(toastrSpy.success).toHaveBeenCalled();
  });

  it('should update stop', () => {

    component.stopName = 'Test';
    component.latitude = 10;
    component.longitude = 20;
    component.editingStopId = 1;

    apiSpy.updateStop.and.returnValue(of({ status: true }));

    component.saveStop();

    expect(apiSpy.updateStop).toHaveBeenCalled();
    expect(toastrSpy.success).toHaveBeenCalled();
  });

  /* ---------------- EDIT STOP ---------------- */

  it('should edit stop', () => {

    spyOn<any>(component, 'setMarker');

    const stop = {
      stopId: 1,
      stopName: 'Hyderabad',
      latitude: 17,
      longitude: 78
    };

    component.editStop(stop);

    expect(component.editingStopId).toBe(1);
    expect(component.stopName).toBe('Hyderabad');
  });

  /* ---------------- DELETE STOP ---------------- */

  it('should delete stop', () => {

    spyOn(window, 'confirm').and.returnValue(true);

    apiSpy.deleteStop.and.returnValue(of({ status: true }));

    component.deleteStop(1);

    expect(apiSpy.deleteStop).toHaveBeenCalled();
    expect(toastrSpy.success).toHaveBeenCalled();
  });

  it('should cancel delete if confirm false', () => {

    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteStop(1);

    expect(apiSpy.deleteStop).not.toHaveBeenCalled();
  });

  /* ---------------- RESET ---------------- */

  it('should reset form', () => {

    component.stopName = 'Test';
    component.locationQuery = 'Test';
    component.latitude = 10;
    component.longitude = 20;

    component.reset();

    expect(component.stopName).toBe('');
    expect(component.latitude).toBeNull();
  });

  /* ---------------- ngAfterViewInit ---------------- */
  it('should call initMap and loadStops', fakeAsync(() => {

    spyOn<any>(component, 'initMap');
    spyOn(component, 'loadStops');

    component.map = {
      invalidateSize: jasmine.createSpy()
    };

    component.ngAfterViewInit();

    tick(); // executes first setTimeout
    tick(300); // executes nested setTimeout

    expect((component as any).initMap).toHaveBeenCalled();
    expect(component.loadStops).toHaveBeenCalled();
  }));

  it('should invalidate map size', fakeAsync(() => {

    spyOn<any>(component, 'initMap').and.callFake(() => {
      component.map = {
        invalidateSize: jasmine.createSpy()
      };
    });

    component.ngAfterViewInit();

    tick();
    tick(300);

    expect(component.map.invalidateSize).toHaveBeenCalledWith(true);
  }));
  /* ---------------- REVERSE GEOCODE ---------------- */

  it('should set locationQuery and stopName', async () => {

    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve({
          display_name: 'Hyderabad, Telangana, India',
          address: { city: 'Hyderabad' }
        })
      } as any)
    );

    await (component as any).reverseGeocode(17, 78);
    await new Promise(r => setTimeout(r));

    expect(component.locationQuery).toContain('Hyderabad');
    expect(component.stopName).toBe('Hyderabad');
  });

  it('should return if no display_name', async () => {

    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve({})
      } as any)
    );

    component.locationQuery = '';
    component.stopName = '';

    await (component as any).reverseGeocode(10, 20);
    await new Promise(r => setTimeout(r));

    expect(component.locationQuery).toBe('');
    expect(component.stopName).toBe('');
  });

  it('should show warning if reverseGeocode fails', async () => {

    spyOn(window, 'fetch').and.returnValue(Promise.reject());

    await (component as any).reverseGeocode(10, 20);
    await new Promise(r => setTimeout(r));

    expect(toastrSpy.warning).toHaveBeenCalledWith('Unable to fetch location name');
  });
  it('should initialize map', () => {

    const mapMock: any = {
      setView: jasmine.createSpy().and.callFake(() => mapMock),
      on: jasmine.createSpy()
    };

    (window as any).L = {
      map: jasmine.createSpy().and.returnValue(mapMock),
      tileLayer: jasmine.createSpy().and.returnValue({
        addTo: jasmine.createSpy()
      })
    };

    (component as any).initMap();

    expect((window as any).L.map).toHaveBeenCalledWith('map');
    expect(mapMock.setView).toHaveBeenCalledWith([20.5937, 78.9629], 5);
  }); it('should handle map click', () => {

    let clickHandler: any;

    const mapMock: any = {
      setView: jasmine.createSpy().and.callFake(() => mapMock),
      on: jasmine.createSpy().and.callFake((event: string, fn: any) => {
        if (event === 'click') {
          clickHandler = fn;
        }
      })
    };

    (window as any).L = {
      map: jasmine.createSpy().and.returnValue(mapMock),
      tileLayer: jasmine.createSpy().and.returnValue({
        addTo: jasmine.createSpy()
      })
    };

    spyOn<any>(component, 'setMarker');
    spyOn<any>(component, 'reverseGeocode');

    (component as any).initMap();

    clickHandler({
      latlng: { lat: 10, lng: 20 }
    });

    expect((component as any).setMarker).toHaveBeenCalledWith(10, 20);
    expect(component.editingStopId).toBeNull();
    expect(component.suggestions).toEqual([]);
    expect((component as any).reverseGeocode).toHaveBeenCalledWith(10, 20);
  });
  it('should not initialize map if already exists', () => {

    component.map = {};

    const mapSpy = jasmine.createSpy();

    (window as any).L = {
      map: mapSpy
    };

    (component as any).initMap();

    expect(mapSpy).not.toHaveBeenCalled();
  });
  it('should return early if map is not initialized in refreshMap', () => {

    component.map = null;

    (component as any).refreshMap();

    expect(component.map).toBeNull();
  }); it('should call invalidateSize when map exists', fakeAsync(() => {

    component.map = {
      invalidateSize: jasmine.createSpy()
    };

    (component as any).refreshMap();

    tick(200);

    expect(component.map.invalidateSize).toHaveBeenCalledWith(true);
  })); it('should call invalidateSize on map in refreshMap', fakeAsync(() => {

    component.map = {
      invalidateSize: jasmine.createSpy()
    };

    (component as any).refreshMap();

    tick(200);

    expect(component.map.invalidateSize).toHaveBeenCalledWith(true);

  })); it('should return early if map does not exist in refreshMap', () => {

    component.map = null;

    (component as any).refreshMap();

    expect(component.map).toBeNull();

  }); it('should create marker if marker does not exist', () => {

    const addToSpy = jasmine.createSpy().and.returnValue({});

    (window as any).L = {
      marker: jasmine.createSpy().and.returnValue({
        addTo: addToSpy
      })
    };

    component.map = {
      setView: jasmine.createSpy()
    };

    component.marker = null;

    (component as any).setMarker(10, 20);

    expect((window as any).L.marker).toHaveBeenCalledWith([10, 20]);
    expect(addToSpy).toHaveBeenCalledWith(component.map);
  });
  it('should trigger fetchLocations after delay when query length >= 3', fakeAsync(() => {

    spyOn<any>(component, 'fetchLocations');

    component.locationQuery = 'Hyderabad';

    component.searchLocation();

    tick(300);

    expect((component as any).fetchLocations).toHaveBeenCalledWith('Hyderabad');

  })); it('should clear previous search timer before setting new one', fakeAsync(() => {

    spyOn<any>(component, 'fetchLocations');

    (component as any).searchTimer = 123; component.locationQuery = 'Delhi';

    component.searchLocation();

    tick(300);

    expect((component as any).fetchLocations).toHaveBeenCalledWith('Delhi');

  })); it('should set suggestions from fetched locations', async () => {

    const mockData = [
      { display_name: 'Hyderabad, India' },
      { display_name: 'Hyderabad Airport' }
    ];

    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve(mockData)
      } as any)
    );

    component.locationQuery = 'Hyderabad';

    await (component as any).fetchLocations('Hyderabad');

    await new Promise(r => setTimeout(r));

    expect(component.suggestions).toEqual(mockData);

  }); it('should set suggestions to empty array if fetch returns null', async () => {

    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve(null)
      } as any)
    );

    component.locationQuery = 'Delhi';

    await (component as any).fetchLocations('Delhi');

    await new Promise(r => setTimeout(r));

    expect(component.suggestions).toEqual([]);

  }); it('should show error when location search fails', async () => {

    spyOn(window, 'fetch').and.returnValue(Promise.reject());

    component.locationQuery = 'Hyderabad';

    await (component as any).fetchLocations('Hyderabad');

    await new Promise(r => setTimeout(r));

    expect(toastrSpy.error).toHaveBeenCalledWith('Location search failed');

  }); it('should show error if createStop response status is false', () => {

    component.stopName = 'Test Stop';
    component.latitude = 10;
    component.longitude = 20;

    apiSpy.createStop.and.returnValue(of({
      status: false,
      message: 'Creation failed'
    }));

    component.saveStop();

    expect(toastrSpy.error).toHaveBeenCalledWith('Creation failed');

  }); it('should remove marker from map during reset', () => {

    const markerMock = {};

    component.marker = markerMock;

    component.map = {
      removeLayer: jasmine.createSpy()
    };

    component.reset();

    expect(component.map.removeLayer).toHaveBeenCalledWith(markerMock);
    expect(component.marker).toBeNull();

  });
});
