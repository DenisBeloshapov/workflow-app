export function getCurrentUser() {
  let user = localStorage.getItem('user')

  if (!user) {
    user = prompt('Денис Б') || 'Без имени'
    localStorage.setItem('user', user)
  }

  return user
}