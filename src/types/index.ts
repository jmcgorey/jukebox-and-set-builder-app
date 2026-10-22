/**
 * Represents the global account profile for a single musician or band.
 * It owns data about songs, setlists, etc.
 */
export interface Musician {
	/** The musician's internal system id */
	id: string
	/** The musician's email address */
	email: string
	/** The name to present to audience members */
	stageName: string
	/** A string used for creating vanity urls for users to connect to */
	urlSlug: string
	/** An ISO timestamp stating when the record was created */
	createdAt: string
	/** An ISO timestamp stating the last time the record was last modified */
	updatedAt: string
}

/** 
 * Represents a song within a musician's full catalog. This is more of a blueprint
 * that is referenced, instead of being modified during live jukebox sessions.
 */
export interface Song {
	/** The internal system id for this song */
	id: string
	/** The id of the Musician this song belongs to */
	musicianId: string
	/** The title of the song */
	title: string
	/** The original artist of the song */
	artist: string
	/** The name of the album the song appears on */
	album?: string
	/** The year the song was released */
	year?: number
	/** The duration, in seconds, of this song. This is formatted to minutes & seconds when displayed. */
	durationSeconds: number
	/** A string list of tags describing the song. This can be helpful for sorting when creating set lists. */
	tags: string[]
	/** An optional url pointing to a file containing the sheet music/tabulature for the song. If provided, we can use it to open the song for the musician. */
	fileUrl?: string
	/** An ISO timestamp stating when the record was created */
	createdAt: string
	/** An ISO timestamp stating when the record was last modified */
	updatedAt: string
}

/**
 * Represents a "blueprint" for a show.  This can be reused multiple times and
 * are leveraged by "Gig" records to facilitate individual shows.
 * 
 * Setlists have two types, which the musician can select based on what they want to do:
 * - `manual`, where the order of the songs matter and the musician builds 
 *   their own queue to play off of
 * - `jukebox`, where the order of the songs does *not* matter, and the musician
 *   just constructs a set of songs that the audience can pick from 
 */
export interface Setlist {
	/** The internal system id for the Setlist */
	id: string
	/** The id of the Musician that owns this Setlist */
	musicianId: string
	/** The name of the Setlist */
	name: string
	/** The type of the Setlist */
	type: 'manual' | 'jukebox'
	/** An ISO timestamp stating when the record was created */
	createdAt: string
	/** AN ISO timestamp stating when the record was last modified */
	updatedAt: string
}

/**
 * A junction record mapping Songs to Setlists. 
 */
export interface SetlistSong {
	/** The internal system id for the junction record */
	id: string
	/** The id of the Setlist record to point the song at */
	setlistId: string
	/** The id of the Song record to use on the Setlist */
	songId: string
	/** Order used to sort tracks in Manual Setlists */
	displayOrder: number
}

/**
 * Represents a distinct performance window in time (e.g., "Live at Pub X - Oct 22nd").
 * Used to keep a historical record of a performance, and also serves as basically
 * a copied "instance" of a Setlist.
 */
export interface Gig {
	/** The internal system id for the Gig record */
	id: string
	/** The id of the Musician that owns the Gig */
	musicianId: string
	/** The Setlist being used for the Gig */
	setlistId: string
	/** The performance title */
	name: string
	/** Whether the Gig is currently active.  Only one Gig may be active per musician at any given time. */
	isActive: boolean
	/** An ISO timestamp stating when the record was created */
	createdAt: string
	/** An ISO timestamp stating when the record was last modified */
	updatedAt: string
}

/**
 * The status of a Song in the queue for a Gig.
 * The statuses are:
 * - creating - An audience member is entering a request for the song, but it is not yet in the queue
 * - pending - The song is in the queue, waiting to be played
 * - playing - The musician is currently playing the song
 * - completed - The song has already been played
 * - skipped - The musician decided to skip the song
 */
export type QueueStatus = 'creating' | 'pending' | 'playing' | 'completed' | 'skipped'

/**
 * Represents a Song inside the FIFO performance queue for a Gig.
 * A combination of the timestamps and the status enforce the queue order.
 */
export interface QueueEntry {
	/** The internal system id for the entry */
	id: string
	/** The Gig the queued song corresponds to */
	gigId: string
	/** The id of the queued song */
	songId: string
	/** The (optional) name of the audience member that requested the song */
	requesterName?: string
	/** Any (optional) notes the audience member would like to share with the musician */
	requesterNotes?: string
	/** The status of the song in the queue */
	status: QueueStatus
	/** An ISO timestamp stating when the song was added to the queue */
	createdAt: string
	/** An ISO timestamp stating when the queued entry was last modified */
	updatedAt: string
}