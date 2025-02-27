function Home() {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to RentWise</h1>
        <p className="text-lg mb-6">Find your perfect rental in Bangalore with AI-powered insights.</p>
        <a href="/properties" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">Explore Properties</a>
      </div>
    );
  }
  
  export default Home;