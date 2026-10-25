// Layout for the sign-in and sign-up pages. Centers the Clerk form on the screen.
const AuthLayout =({children}:{children: React.ReactNode}) => {
    return (
        <div className="h-full flex items-center justify-center">
            {children}
        </div>
      );
}
 
export default AuthLayout ;