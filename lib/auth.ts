import { supabase } from './supabase'

const generateEmail = (fullName: string) => {
  return 'user' + fullName.length + '@gmail.com'
}
export const signUp = async (fullName: string, password: string) => {
  const email = generateEmail(fullName)

  console.log('REGISTER EMAIL:', email)

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
}

export const signIn = async (fullName: string, password: string) => {
  const email = generateEmail(fullName)

  console.log('LOGIN EMAIL:', email)

  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}