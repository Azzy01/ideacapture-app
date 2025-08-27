
// ===== LOCAL STORAGE FUNCTIONS =====
function saveNoteToStorage(note) {
// 1. Get existing notes from storage
const existingNotes = getNotesFromStorage();

// 2. Add new note with unique ID and timestamp
const newNote = {
id: Date.now(), // Simple unique ID
type: 'text',
title: note.title,
content: note.content,
tags: note.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
createdAt: new Date().toISOString()
};

// 3. Add to array and save back to storage
existingNotes.push(newNote);
localStorage.setItem('ideacapture-notes', JSON.stringify(existingNotes));

return newNote;
}

function getNotesFromStorage() {
// Get notes from storage or return empty array if none exist
const notesJSON = localStorage.getItem('ideacapture-notes');
return notesJSON ? JSON.parse(notesJSON) : [];
}

function deleteNoteFromStorage(noteId) {
// Filter out the note to delete
const notes = getNotesFromStorage();
const updatedNotes = notes.filter(note => note.id !== noteId);
localStorage.setItem('ideacapture-notes', JSON.stringify(updatedNotes));
}

function displayNotes() {
const notesGrid = document.getElementById('notesGrid');
const notes = getNotesFromStorage();

// CLEAR the grid completely before re-rendering
notesGrid.innerHTML = '';

// Add all notes from storage
notes.forEach(note => {
const noteElement = createNoteElement(note);
notesGrid.prepend(noteElement);
});
}

function createNoteElement(note) {
const noteDate = new Date(note.createdAt).toLocaleDateString();

const noteElement = document.createElement('div');
noteElement.className = 'note-card';
noteElement.dataset.id = note.id;

noteElement.innerHTML = `
<div class="note-header">
    <div class="note-title">${escapeHTML(note.title)}</div>
    <div class="note-date">${noteDate}</div>
</div>
<div class="note-content">${escapeHTML(note.content)}</div>
<div class="note-tags">
    ${note.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}
</div>
<button class="btn-delete" onclick="deleteNote(${note.id})">Delete</button>
`;

return noteElement;
}

function escapeHTML(text) {
// Prevent XSS attacks by escaping HTML characters
return text.replace(/[&<>"']/g, function(m) {
return {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[m];
});
}

// ===== EVENT HANDLERS =====
function deleteNote(noteId) {
if (confirm('Are you sure you want to delete this note?')) {
deleteNoteFromStorage(noteId);
displayNotes(); // Refresh the display
}
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {

// Update tag cloud when page loads
updateTagCloud();

// Add event listener for clear filter button
document.getElementById('clearFilterBtn').addEventListener('click', clearFilter);

// Load existing notes when page loads
displayNotes();

// Update save button handler
document.getElementById('saveNoteBtn').addEventListener('click', function() {
const title = document.getElementById('noteTitle').value.trim();
const content = document.getElementById('noteContent').value.trim();
const tags = document.getElementById('noteTags').value.trim();

if (title && content) {
    const note = { title, content, tags };
    saveNoteToStorage(note);
    
    // Clear form
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('noteTags').value = '';
    
    // Refresh display
    displayNotes();
    
     // ← ADD THIS LINE → 
    updateTagCloud(); // Update tag cloud with new tags

    // Show success feedback
    alert('Note saved successfully!');
} else {
    alert('Please add both a title and content for your note.');
}
});
});

// ===== TAG FILTERING FUNCTIONS =====
function updateTagCloud() {
const tagCloud = document.getElementById('tagCloud');
const notes = getNotesFromStorage();

// Get all unique tags
const allTags = new Set();
notes.forEach(note => {
    note.tags.forEach(tag => allTags.add(tag));
});

// Clear and rebuild tag cloud
tagCloud.innerHTML = '';
allTags.forEach(tag => {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.textContent = tag;
    tagElement.onclick = () => filterNotesByTag(tag);
    tagCloud.appendChild(tagElement);
});
}

function filterNotesByTag(tag) {
// Show clear filter button
document.getElementById('clearFilterBtn').classList.remove('hidden');

// Filter and display notes
const notes = getNotesFromStorage();
const filteredNotes = notes.filter(note => note.tags.includes(tag));
displayFilteredNotes(filteredNotes);

// Update active state in tag cloud
document.querySelectorAll('.tag-cloud .tag').forEach(el => {
    el.classList.toggle('active', el.textContent === tag);
});
}

function displayFilteredNotes(notes) {
const notesGrid = document.getElementById('notesGrid');
notesGrid.innerHTML = '';

notes.forEach(note => {
    const noteElement = createNoteElement(note);
    notesGrid.appendChild(noteElement);
});
}

function clearFilter() {
// Hide clear button
document.getElementById('clearFilterBtn').classList.add('hidden');

// Remove active states
document.querySelectorAll('.tag-cloud .tag').forEach(el => {
    el.classList.remove('active');
});

// Show all notes
displayNotes();
}
