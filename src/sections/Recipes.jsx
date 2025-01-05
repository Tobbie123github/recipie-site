import { useState, useEffect } from 'react';
import Recipe from '../components/Recipe';
import NotFound from '../assets/not-found.png';

const Recipes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [likedRecipes, setLikeRecipes] = useState([]);
  const [showLiked, setShowLiked] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [resultsPerPage, setResultsPerPage] = useState(6);
  const [selectedRecipeDetails, setSelectedRecipeDetails] = useState(null);

  useEffect(() => {
    const storedLikedRecipes = JSON.parse(localStorage.getItem('likedRecipes') || '[]');
    setLikeRecipes(storedLikedRecipes);
  }, []);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://api.spoonacular.com/recipes/complexSearch?query=${searchTerm}&offset=${(currentPage - 1) * resultsPerPage}&number=${resultsPerPage}&apiKey=${import.meta.env.VITE_SPOONACULAR_API_KEY}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        const data = await response.json();
        setRecipes(data.results);
        setTotalResults(data.totalResults);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [searchTerm, currentPage]);

  const handleLikedToggle = (recipeId) => {
    setLikeRecipes((prevLiked) => {
      let updatedLiked;
      if (prevLiked.includes(recipeId)) {
        updatedLiked = prevLiked.filter((id) => id !== recipeId);
      } else {
        updatedLiked = [...prevLiked, recipeId];
      }
      localStorage.setItem('likedRecipes', JSON.stringify(updatedLiked));
      return updatedLiked;
    });
  };

  const handleRecipeDetailsToggle = async (recipeId) => {
    if (selectedRecipeDetails?.id === recipeId) {
      // If the details for the recipe are already shown, hide them
      setSelectedRecipeDetails(null);
    } else {
      try {
        const response = await fetch(
          `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${import.meta.env.VITE_SPOONACULAR_API_KEY}`
        );
        const data = await response.json();
          console.log(data);
        setSelectedRecipeDetails(data);
      } catch (error) {
        console.error('Failed to fetch recipe details', error);
      }
    }
  };

  const handleOverlayClick = () => {
    setSelectedRecipeDetails(null);
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedRecipes = showLiked
    ? filteredRecipes.filter((recipe) => likedRecipes.includes(recipe.id))
    : filteredRecipes;

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="md:flex md:justify-between md:w-full md:items-center">
        <div className="relative mb-4 w-1/2 md:mb-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recipes...."
            className="w-full rounded-lg border border-gray-100 p-4 pl-12 focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
        </div>

        <div>
          <button
            onClick={() => setShowLiked(!showLiked)}
            className="font-500 rounded-lg bg-primary-400 px-4 py-2 text-white"
          >
            {showLiked ? 'All recipes' : 'Liked recipes'}
          </button>
        </div>
      </div>

      <div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {displayedRecipes.length === 0 ? (
          <div>
            <img className="mx-auto size-[400px]" src={NotFound} alt="not found" />
            <p className="text-500 font-600 text-center">No recipes found</p>
          </div>
        ) : (
          <div className="mt-8 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {displayedRecipes.map((recipe) => (
              <div key={recipe.id} className="relative mb-4 rounded-lg bg-white shadow-md">
                <Recipe
                  recipe={recipe}
                  isLiked={likedRecipes.includes(recipe.id)}
                  onToggle={handleLikedToggle}
                />
                <button
                  onClick={() => handleRecipeDetailsToggle(recipe.id)}
                  className="w-full mt-2 bg-primary-400 text-white py-2 rounded-md"
                >
                  {selectedRecipeDetails?.id === recipe.id ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-primary-400 text-white rounded-lg"
        >
          Previous
        </button>
        <p className="text-lg">
          Page {currentPage} of {totalPages}
        </p>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-primary-400 text-white rounded-lg"
        >
          Next
        </button>
      </div>

      {/* Overlay for showing recipe details */}
      {selectedRecipeDetails && (
        <div
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-lg h-[80vh] p-6 w-4/5 max-w-3xl overflow-auto"
          >
            <h3 className="text-xl font-semibold">{selectedRecipeDetails.title}</h3>
            <ul className="mt-4">
              {selectedRecipeDetails.extendedIngredients.map((ingredient) => (
                <li key={ingredient.id}>
                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                </li>
              ))}
            </ul>
            <p className="mt-4">{selectedRecipeDetails.instructions}</p>
            {selectedRecipeDetails.nutrition && (
              <div className="mt-4">
                <h4 className="font-semibold">Nutrition Info:</h4>
                <ul>
                  {selectedRecipeDetails.nutrition.nutrients.map((nutrient) => (
                    <li key={nutrient.title}>
                      {nutrient.title}: {nutrient.amount} {nutrient.unit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Recipes;
