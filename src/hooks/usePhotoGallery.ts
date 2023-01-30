import { useState, useEffect } from "react";
import { isPlatform } from "@ionic/react";

import {
	Camera,
	CameraResultType,
	CameraSource,
	Photo,
} from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

export interface UserPhoto {
	filepath: string;
	webviewPath?: string;
}

const PHOTO_STORAGE = "photo";

// SAVE IMAGE PERMANETELY
const savePhotos = async (
	photo: Photo,
	fileName: string
): Promise<UserPhoto> => {
	// convert to base64 format
	const base64Data = await base64FromPath(photo.webPath as string);
	const savedFile = await Filesystem.writeFile({
		path: fileName,
		data: base64Data,
		directory: Directory.Data,
	});
	return {
		filepath: fileName,
		webviewPath: photo.webPath,
	};
};

export const usePhotoGallery = () => {
	const [photos, setPhotos] = useState<UserPhoto[]>([]);

	useEffect(() => {
		const loadSaved = async () => {
			const { value } = await Preferences.get({ key: PHOTO_STORAGE });
			const photosInPreferences = (
				value ? JSON.parse(value) : []
			) as UserPhoto[];
			for (let photo of photosInPreferences) {
				const file = await Filesystem.readFile({
					path: photo.filepath,
					directory: Directory.Data,
				});
				// for only webb version
				photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
			}
			setPhotos(photosInPreferences);
		};

		loadSaved();
	}, []);

	const takePics = async () => {
		const photo = await Camera.getPhoto({
			resultType: CameraResultType.Uri,
			source: CameraSource.Camera,
			quality: 100,
		});

		const fileName = new Date().getTime() + ".jpeg";
		const savedFileImage = await savePhotos(photo, fileName);
		const newPhotos = [savedFileImage, ...photos];
		console.log({ newPhotos });

		setPhotos(newPhotos);
		Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });
	};

	return {
		photos,
		takePics,
	};
};

export async function base64FromPath(path: string): Promise<string> {
	const response = await fetch(path);
	const blob = await response.blob();

	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = reject;
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
			} else {
				reject("method did not return a string");
			}
		};
	});
}
