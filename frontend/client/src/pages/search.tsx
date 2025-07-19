import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SkillsInput } from "@/components/skills-input";
import { useLocation } from "wouter";
import { searchFormSchema, type SearchForm } from "@shared/schema";
import { LOCATIONS, EXPERIENCE_LEVELS, PROJECT_DATE_OPTIONS } from "@/lib/constants";

export default function SearchPage() {
  const [, navigate] = useLocation();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const form = useForm<SearchForm>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      prompt: "",
      skills: [],
      location: "",
      experience: "",
      projectDate: "",
    },
  });

  const onSubmit = (data: SearchForm) => {
    const searchData = {
      ...data,
      skills: selectedSkills,
    };
    
    // Store search data in localStorage for results page
    localStorage.setItem('searchQuery', JSON.stringify(searchData));
    navigate('/results');
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 gradient-text">
            Find Your Developer
          </h1>
          <p className="text-xl text-gray-300 text-center mb-12">
            Describe your project or specify the skills you need
          </p>
          
          <div className="card-holographic rounded-2xl p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Project Description */}
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Project Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your project, what you're building, or the specific skills you need..."
                          className="h-32 bg-[hsl(217,33%,17%)] border-[hsl(195,100%,50%)]/30 text-white placeholder-gray-400 focus:border-[hsl(195,100%,50%)] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Filters Section */}
                <div className="border-t border-gray-600 pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Filter className="text-[hsl(195,100%,50%)] mr-2 h-5 w-5" />
                    Advanced Filters (Optional)
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Skills Filter */}
                    <div>
                      <FormLabel className="font-medium mb-2 block">Skills</FormLabel>
                      <SkillsInput
                        selectedSkills={selectedSkills}
                        onSkillsChange={setSelectedSkills}
                      />
                    </div>

                    {/* Location Filter */}
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Location</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-[hsl(217,33%,17%)] border-[hsl(195,100%,50%)]/30 text-white focus:border-[hsl(195,100%,50%)]">
                                <SelectValue placeholder="Any Location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[hsl(217,33%,17%)] border-[hsl(195,100%,50%)]/30">
                              {LOCATIONS.map((location) => (
                                <SelectItem key={location.value} value={location.value}>
                                  {location.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Experience Level */}
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Experience Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-[hsl(217,33%,17%)] border-[hsl(195,100%,50%)]/30 text-white focus:border-[hsl(195,100%,50%)]">
                                <SelectValue placeholder="Any Level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[hsl(217,33%,17%)] border-[hsl(195,100%,50%)]/30">
                              {EXPERIENCE_LEVELS.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Project Date */}
                    <FormField
                      control={form.control}
                      name="projectDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Project Date</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-[hsl(217,33%,17%)] border-[hsl(195,100%,50%)]/30 text-white focus:border-[hsl(195,100%,50%)]">
                                <SelectValue placeholder="Any Date" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[hsl(217,33%,17%)] border-[hsl(195,100%,50%)]/30">
                              {PROJECT_DATE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="text-center">
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-gradient-to-r from-[hsl(195,100%,50%)] to-[hsl(158,64%,52%)] text-[hsl(222,84%,5%)] px-12 py-4 text-lg font-bold hover:scale-105 transition-transform"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Search Developers
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
