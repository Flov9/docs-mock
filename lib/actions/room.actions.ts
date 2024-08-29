'use server';

import { nanoid } from 'nanoid'
import { liveblocks } from '../liveblocks';
import { revalidatePath } from 'next/cache';
import { getAccessType, parseStringify } from '../utils';

export const createDocument = async ({ userId, email }: CreateDocumentParams) => {
    const roomId = nanoid();

    try {
        const metadata = {
            creatorId: userId,
            email,
            title: 'Untitled'
        }

        const usersAccesses: RoomAccesses = {
            [email]: ['room:write']
        }

        const room = await liveblocks.createRoom(roomId, {
            metadata,
            usersAccesses,
            defaultAccesses: [],
        });

        revalidatePath('/');

        return parseStringify(room);
    } catch (error) {
        console.log(`Error happened while creating a room: ${error}`)
    }
}

export const getDocument = async ({ roomId, userId }: { roomId: string, userId: string }) => {
    try {
            const room = await liveblocks.getRoom(roomId);
        
            // const hasAccess = Object.keys(room.usersAccesses).includes(userId);
        
            // if (!hasAccess) throw new Error("You do not have access to this document.");

            return parseStringify(room);
    } catch (error) {
        console.log(`There is an error while getting a room: ${error}`);
    }
}

export const updateDocument = async (roomId: string, title: string) => {
    try {
        const updatedRoom = await liveblocks.updateRoom(roomId, {
            metadata: {
                title
            }
        })

        revalidatePath(`/documents/${roomId}`);

        return parseStringify(updatedRoom);
    } catch (error) {
        console.log(`An error happened while updating the room: ${error}`)
    }
}

export const getDocuments = async (email: string) => {
    try {
            const rooms = await liveblocks.getRooms({ userId: email });

            return parseStringify(rooms);
    } catch (error) {
        console.log(`There is an error while getting rooms: ${error}`);
    }
}

export const updateDocumentAccess = async ({ roomId, email, userType, updatedBy }: ShareDocumentParams) => {
    try {
        const usersAccesses: RoomAccesses = {
            [email]: getAccessType(userType) as AccessType, // [email] uses the email values as the keys
        }

        const room = await liveblocks.updateRoom(roomId, {
            usersAccesses
        })

        if (room) {
            // TODO: Send a notif to user
        }
        
        revalidatePath(`/documents/${roomId}`)
        
        return parseStringify(room);
    } catch (error) {
        console.log(`Error happened while updating a room access: ${error}`)
    }
}

export const removeCollaborator = async ({ roomId, email }: { roomId: string, email: string }) => {
    try {
        const room = await liveblocks.getRoom(roomId);

        if (room.metadata.email === email) throw new Error('You cannot remove yourself from the document!');

        const updatedRoom = liveblocks.updateRoom(roomId, {
            [email]: null,
        })

        revalidatePath(`/documents/${roomId}`);

        return parseStringify(updatedRoom);
    } catch (error) {
        console.log(`Error happened while removing a collaborator: ${error}`)
    }
}