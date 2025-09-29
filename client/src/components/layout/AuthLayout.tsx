import React from 'react'

function AuthLayout({children}: {children: React.ReactNode}) {
  return (
   <div className="flex">
    <div className="w-screen h-screen md:w-[60vw] px-12 pt-8 pb-12">
        <h2 className='text-lg font-medium text-black'>Task Manager</h2>
        {children}
    </div>
    <div className='hidden md:block w-[40vw] h-screen bg-gradient-to-tr from-blue-500 to-purple-600'>
        <img src="/assets/auth.svg" className='w-64 lg:w-[90%]'/>
    </div>
   </div>
  )
}

export default AuthLayout