const skills = ['Python', 'JavaScript', 'React', 'Node.js', 'Machine Learning', 'Data Science', 'HTML', 'CSS', 'Flask', 'Django'];
const input = document.getElementById('skillInput');
const suggestionsDiv = document.getElementById('suggestions');
const tagsContainer = document.getElementById('tagsContainer');
const skillError = document.getElementById('skillError');
const searchButton = document.getElementById('searchButton');
const tagWrapper = document.getElementById('tagWrapper');

let selectedSkills = [];

input.addEventListener('input', () => {
  const value = input.value.toLowerCase();
  suggestionsDiv.innerHTML = '';
  if (!value) return;

  const filtered = skills.filter(skill => skill.toLowerCase().includes(value) && !selectedSkills.includes(skill));
  filtered.forEach(skill => {
    const btn = document.createElement('button');
    btn.className = 'px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200';
    btn.textContent = skill;
    btn.onclick = () => addSkill(skill);
    suggestionsDiv.appendChild(btn);
  });
});

function addSkill(skill) {
  if (selectedSkills.includes(skill)) return;
  selectedSkills.push(skill);
  renderTags();
  input.value = '';
  suggestionsDiv.innerHTML = '';
  skillError.classList.add('hidden');
  updateTagWrapperBorder();
}

function removeSkill(skill) {
  selectedSkills = selectedSkills.filter(s => s !== skill);
  renderTags();
  updateTagWrapperBorder();
}

function renderTags() {
  tagsContainer.innerHTML = '';
  selectedSkills.forEach(skill => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `${skill} <span class="tag-remove" onclick="removeSkill('${skill}')">×</span>`;
    tagsContainer.appendChild(tag);
  });
}

function updateTagWrapperBorder() {
  tagWrapper.classList.remove('valid', 'invalid');
  if (selectedSkills.length >= 3) {
    tagWrapper.classList.add('valid');
  } else {
    tagWrapper.classList.add('invalid');
  }
}

searchButton.addEventListener('click', () => {
  if (selectedSkills.length < 3) {
    skillError.classList.remove('hidden');
    tagWrapper.classList.add('invalid');
  } else {
    skillError.classList.add('hidden');
    tagWrapper.classList.remove('invalid');
    tagWrapper.classList.add('valid');
    alert(`Searching with skills: ${selectedSkills.join(', ')}`);
  }
});

document.getElementById('filterToggle').addEventListener('click', () => {
  document.getElementById('filterSection').classList.toggle('hidden');
});
