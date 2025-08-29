// ===== SUPABASE SETUP =====
let supabase = null;

function initializeSupabase() {
    try {
        const SUPABASE_URL = 'https://fdwxcunlytbhdnnjzgua.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkd3hjdW5seXRiaGRubmp6Z3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTQ3MjksImV4cCI6MjA3MTg3MDcyOX0.WqQROmzPJcfzZVoRTW2MFjryulKvw7IWGHKnaphCEcU';
        
        // Check if Supabase library is loaded
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized successfully!');
            return true;
        } else {
            console.log('Supabase library not loaded yet');
            return false;
        }
    } catch (error) {
        console.error('Supabase initialization failed:', error);
        return false;
    }
}

async function getSupabase() {
    if (!supabase) {
        // Initialize if not already done
        if (!initializeSupabase()) {
            throw new Error('Supabase failed to initialize');
        }
    }
    return supabase;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Try to initialize Supabase
    setTimeout(() => {
        if (initializeSupabase()) {
            console.log('Supabase ready to use');
        } else {
            console.log('Supabase will be initialized when needed');
        }
    }, 1000);
    
    // YOUR EXISTING WORKING CODE CONTINUES HERE...
    displayNotes();
    // ... etc ...
});


// ===== LOCAL STORAGE FUNCTIONS =====
function saveNoteToStorage(note) {
    const existingNotes = getNotesFromStorage();
    
    // FIX: Handle both array and string tags
    const tagsArray = Array.isArray(note.tags) 
        ? note.tags 
        : note.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    
    const newNote = {
        id: Date.now(),
        type: note.type || 'text',
        title: note.title,
        content: note.content,
        tags: tagsArray,  // ← Now this is always an array
        createdAt: new Date().toISOString()
    };
    
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

// ===== IMAGE UPLOAD FUNCTIONS =====
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Show preview
    showImagePreview(file);
    
    // Show upload progress
    const progressDiv = document.getElementById('uploadProgress');
    progressDiv.classList.remove('hidden');
    
    try {
        // Upload to Supabase
        const { data, error } = await supabase.storage
            .from('note-images')
            .upload(`images/${Date.now()}_${file.name}`, file);
        
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('note-images')
            .getPublicUrl(data.path);
        
        // Store the image URL for when note is saved
        window.currentImageUrl = urlData.publicUrl;
        
        // Hide progress, show success
        progressDiv.classList.add('hidden');
        alert('Image uploaded successfully! Click "Save Idea" to save the note.');
        
    } catch (error) {
        console.error('Upload error:', error);
        progressDiv.classList.add('hidden');
        alert('Error uploading image: ' + error.message);
    }
}

function showImagePreview(file) {
    const previewDiv = document.getElementById('imagePreview');
    previewDiv.classList.remove('hidden');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewDiv.innerHTML = `<img src="${e.target.result}" alt="Image preview">`;
    };
    reader.readAsDataURL(file);
}

function clearImagePreview() {
    const previewDiv = document.getElementById('imagePreview');
    previewDiv.classList.add('hidden');
    previewDiv.innerHTML = '';
    
    const progressDiv = document.getElementById('uploadProgress');
    progressDiv.classList.add('hidden');
    
    document.getElementById('noteImage').value = '';
    window.currentImageUrl = null;
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {

// Update tag cloud when page loads
updateTagCloud();

// Add event listener for clear filter button
document.getElementById('clearFilterBtn').addEventListener('click', clearFilter);

// Content type switching - This makes tabs clickable!
const contentTypes = document.querySelectorAll('.content-type');
const inputGroups = {
    text: document.getElementById('textNoteGroup'),
    link: document.getElementById('linkNoteGroup'), 
    image: document.getElementById('imageNoteGroup'),
    audio: document.getElementById('audioNoteGroup')
};

contentTypes.forEach(type => {
    type.addEventListener('click', () => {
        contentTypes.forEach(t => t.classList.remove('active'));
        type.classList.add('active');
        
        const selectedType = type.getAttribute('data-type');
        Object.keys(inputGroups).forEach(key => {
            inputGroups[key].classList.toggle('hidden', key !== selectedType);
        });
        
        // Clear image preview when switching away from image
        if (selectedType !== 'image') {
            clearImagePreview();
        }
    });
});

// Load existing notes when page loads
displayNotes();

// Update save button handler
document.getElementById('saveNoteBtn').addEventListener('click', function() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const tags = document.getElementById('noteTags').value.trim();
    
    if (title && content) {
        // Simple text note only for testing
        const note = {
            id: Date.now(),
            type: 'text',
            title,
            content,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
            createdAt: new Date().toISOString()
        };
        
        saveNoteToStorage(note);
        
        // Clear form and refresh
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteTags').value = '';
        displayNotes();
        updateTagCloud();
        
        alert('Note saved successfully!');
    } else {
        alert('Please add both title and content');
    }
});


document.getElementById('noteImage').addEventListener('change', handleImageUpload);

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


function clearImagePreview() {
    const previewDiv = document.getElementById('imagePreview');
    if (previewDiv) {
        previewDiv.classList.add('hidden');
        previewDiv.innerHTML = '';
    }
    
    const progressDiv = document.getElementById('uploadProgress');
    if (progressDiv) {
        progressDiv.classList.add('hidden');
    }
    
    const fileInput = document.getElementById('noteImage');
    if (fileInput) {
        fileInput.value = '';
    }
    
    window.currentImageUrl = null;
}