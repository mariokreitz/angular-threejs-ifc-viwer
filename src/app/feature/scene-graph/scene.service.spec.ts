import { TestBed } from '@angular/core/testing';
import { Mesh } from 'three';
import type { IFCModel } from 'web-ifc-three/IFC/components/IFCModel';

import { AreaMeasureService } from '../measurement/area-measure.service';
import { MeasureService } from '../measurement/measure.service';
import { InteractionMode } from '../../models/interaction-mode.enum';
import { SceneService } from './scene.service';

describe('SceneService', () => {
  let service: SceneService;
  let areaMeasureServiceMock: {
    onDragStart: (() => void) | null;
    onDragEnd: (() => void) | null;
    cancelActive: ReturnType<typeof vi.fn<() => void>>;
    clearAllAreaMeasurements: ReturnType<typeof vi.fn<() => void>>;
  };
  let measureServiceMock: {
    onDragStart: (() => void) | null;
    onDragEnd: (() => void) | null;
    cancelInteraction: ReturnType<typeof vi.fn<() => void>>;
    clearAllMeasurements: ReturnType<typeof vi.fn<() => void>>;
  };
  let sceneServiceForTests: {
    loadIFCInternal: (url: string) => Promise<void>;
    resolveIfcTypeForExpressID: (expressID: number) => Promise<string>;
    emitSelectedElement: (
      expressID: number | null,
      mesh: Mesh,
      colorHex: string | null,
      selectionToken: number,
    ) => Promise<void>;
    initialized: boolean;
    modelLoaded: boolean;
    loadedUrl: string | null;
    ifcModel: IFCModel | null;
    modelID: number | null;
    selectedMesh: Mesh | null;
    selectedExpressID: number | null;
    selectionRequestToken: number;
  };

  beforeEach((): void => {
    areaMeasureServiceMock = {
      onDragStart: null as (() => void) | null,
      onDragEnd: null as (() => void) | null,
      cancelActive: vi.fn<() => void>(),
      clearAllAreaMeasurements: vi.fn<() => void>(),
    };

    measureServiceMock = {
      onDragStart: null as (() => void) | null,
      onDragEnd: null as (() => void) | null,
      cancelInteraction: vi.fn<() => void>(),
      clearAllMeasurements: vi.fn<() => void>(),
    };

    TestBed.configureTestingModule({
      providers: [
        SceneService,
        { provide: AreaMeasureService, useValue: areaMeasureServiceMock },
        { provide: MeasureService, useValue: measureServiceMock },
      ],
    });

    service = TestBed.inject(SceneService);
    sceneServiceForTests = service as unknown as typeof sceneServiceForTests;
  });

  it('loads a different IFC URL even after a model has already been loaded', async () => {
    const loadInternalSpy = vi.spyOn(sceneServiceForTests, 'loadIFCInternal').mockResolvedValue(undefined);

    sceneServiceForTests.initialized = true;
    sceneServiceForTests.modelLoaded = true;
    sceneServiceForTests.loadedUrl = '/assets/ifc/old.ifc';
    sceneServiceForTests.ifcModel = {} as IFCModel;

    await service.loadIFC('/assets/ifc/new.ifc');

    expect(loadInternalSpy).toHaveBeenCalledTimes(1);
    expect(loadInternalSpy).toHaveBeenCalledWith('/assets/ifc/new.ifc');
  });

  it('keeps same URL load as a no-op when model is already present', async () => {
    const loadInternalSpy = vi.spyOn(sceneServiceForTests, 'loadIFCInternal').mockResolvedValue(undefined);

    sceneServiceForTests.initialized = true;
    sceneServiceForTests.loadedUrl = '/assets/ifc/current.ifc';
    sceneServiceForTests.ifcModel = {} as IFCModel;

    await service.loadIFC('/assets/ifc/current.ifc');

    expect(loadInternalSpy).not.toHaveBeenCalled();
  });

  it('switches model by resetting mode and measurements before loading selected URL', async () => {
    const loadSpy = vi.spyOn(service, 'loadIFC').mockResolvedValue(undefined);
    const setModeSpy = vi.spyOn(service, 'setMode');

    await service.switchModel('/assets/ifc/AC20-Institute-Var-2.ifc.ifc');

    expect(setModeSpy).toHaveBeenCalledWith(InteractionMode.Select);
    expect(measureServiceMock.clearAllMeasurements).toHaveBeenCalledTimes(1);
    expect(areaMeasureServiceMock.clearAllAreaMeasurements).toHaveBeenCalledTimes(1);
    expect(loadSpy).toHaveBeenCalledWith('/assets/ifc/AC20-Institute-Var-2.ifc.ifc');
  });

  it('ignores stale async selected-element responses and keeps latest selection state', async () => {
    const meshA = new Mesh();
    const meshB = new Mesh();

    let resolveFirst: ((value: string) => void) | undefined;
    let resolveSecond: ((value: string) => void) | undefined;

    vi.spyOn(sceneServiceForTests, 'resolveIfcTypeForExpressID').mockImplementation((expressID: number) => {
      return new Promise<string>((resolve): void => {
        if (expressID === 1) {
          resolveFirst = resolve;
          return;
        }

        resolveSecond = resolve;
      });
    });

    sceneServiceForTests.modelID = 11;

    let latestSelection: { expressID: number; ifcType: string } | null = null;
    const subscription = service.selectedElement$.subscribe((selectedElement): void => {
      if (selectedElement !== null) {
        latestSelection = { expressID: selectedElement.expressID, ifcType: selectedElement.ifcType };
      }
    });

    sceneServiceForTests.selectedMesh = meshA;
    sceneServiceForTests.selectedExpressID = 1;
    sceneServiceForTests.selectionRequestToken = 1;
    const staleSelectionPromise = sceneServiceForTests.emitSelectedElement(1, meshA, null, 1);

    sceneServiceForTests.selectedMesh = meshB;
    sceneServiceForTests.selectedExpressID = 2;
    sceneServiceForTests.selectionRequestToken = 2;
    const latestSelectionPromise = sceneServiceForTests.emitSelectedElement(2, meshB, null, 2);

    expect(resolveSecond).toBeDefined();
    if (resolveSecond === undefined) {
      throw new Error('Expected resolver for latest selection');
    }
    resolveSecond('IFCWALL');
    await latestSelectionPromise;

    expect(resolveFirst).toBeDefined();
    if (resolveFirst === undefined) {
      throw new Error('Expected resolver for stale selection');
    }
    resolveFirst('IFCDOOR');
    await staleSelectionPromise;

    expect(latestSelection).toEqual({ expressID: 2, ifcType: 'IFCWALL' });

    subscription.unsubscribe();
  });
});
