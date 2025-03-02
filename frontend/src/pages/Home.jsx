function Home() {
  document.title = 'RentWise - Home';
  return (
    <div className="bg-gray-800 text-white h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-extrabold mb-4">Welcome to RentWise</h1>
      <p className="text-lg text-gray-300 mb-6 max-w-xl text-center">
        Find your perfect rental in Bangalore with AI-powered insights.
      </p>
      <a 
        href="/properties" 
        className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-lg transform transition hover:bg-blue-600 hover:scale-105"
      >
        Explore Properties
      </a>
    </div>
  );
}

export default Home;