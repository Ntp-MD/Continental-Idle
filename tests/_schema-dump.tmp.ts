import { serializeObject } from '../src/blueprint-editor/assetUtils'
const o: any = {
	id: 'obj-test', type: 'asset-test', x: 25, y: 50, rotation: 0,
	w: 50, h: 25, padding: 10, fillColor: '#fff', strokeColor: '#123456',
}
console.log('serialized:', JSON.stringify(serializeObject(o)))
