import { BufferAttribute, Mesh, MeshBasicMaterial, SphereGeometry } from 'three';
import { type Viewer } from '../Viewer';
import { SPHERE_RADIUS } from '../data/constants';
import { EquirectangularAdapter, EquirectangularMesh, EquirectangularTextureData } from './EquirectangularAdapter';
import { AdapterConstructor } from './AbstractAdapter';
import { logWarn } from '../utils';

export type DualFisheyeAdapterConfig = {
    /**
     * number of faces of the sphere geometry, higher values may decrease performances
     * @default 64
     */
    resolution?: number;
};

/**
 * @deprecated Use the "@photo-sphere-viewer/dual-fisheye-adapter" package
 */
export class DualFisheyeAdapter extends EquirectangularAdapter {
    static override readonly id: string = 'dual-fisheye';
    static override readonly VERSION = PKG_VERSION;

    static override withConfig(config: DualFisheyeAdapterConfig): [AdapterConstructor, any] {
        return [DualFisheyeAdapter, config];
    }

    constructor(viewer: Viewer, config?: DualFisheyeAdapterConfig) {
        super(viewer, {
            resolution: config?.resolution ?? 64,
            useXmpData: false,
        });

        logWarn(`"DualFisheyeAdapter" must be imported from "@photo-sphere-viewer/dual-fisheye-adapter" package`);
    }

    override async loadTexture(panorama: string, loader?: boolean): Promise<EquirectangularTextureData> {
        const result = await super.loadTexture(panorama, loader, null, false);
        result.panoData = null;
        return result;
    }

    override createMesh(): EquirectangularMesh {
        const geometry = new SphereGeometry(
            SPHERE_RADIUS,
            this.SPHERE_SEGMENTS,
            this.SPHERE_HORIZONTAL_SEGMENTS,
        )
            .scale(-1, 1, 1)
            .toNonIndexed() as SphereGeometry;

        const uvs = geometry.getAttribute('uv') as BufferAttribute;
        const normals = geometry.getAttribute('normal') as BufferAttribute;

        for (let i = 0; i < uvs.count; i++) {
            for (let j = 0; j < 3; j++) {
                const index = i * 3 + j;

                const x = normals.getX(index);
                const y = normals.getY(index);
                const z = normals.getZ(index);

                const c = 0.947;
                if (i < uvs.count / 6) {
                    const correction = (x === 0 && z === 0) ? 1 : (Math.acos(y) / Math.sqrt(x * x + z * z)) * (2 / Math.PI);
                    uvs.setXY(index,
                        x * (c / 4) * correction + (1 / 4),
                        z * (c / 2) * correction + (1 / 2),
                    );
                } else {
                    const correction = (x === 0 && z === 0) ? 1 : (Math.acos(-y) / Math.sqrt(x * x + z * z)) * (2 / Math.PI);
                    uvs.setXY(index,
                        -x * (c / 4) * correction + (3 / 4),
                        z * (c / 2) * correction + (1 / 2),
                    );
                }
            }
        }

        geometry.rotateX(-Math.PI / 2);
        geometry.rotateY(Math.PI);

        const material = new MeshBasicMaterial({ depthTest: false, depthWrite: false });

        return new Mesh(geometry, material);
    }
}
